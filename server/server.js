import express from 'express';
import cors from 'cors';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = join(__dirname, 'data');
const ZONES_IMPORT_FILE = join(__dirname, '..', 'zones-import.json');

// Ensure data directory exists
await fs.mkdir(DATA_DIR, {recursive: true});

// Auto-import zones from zones-import.json on startup if profile has no zones
async function autoImportZones() {
  console.log('\n[STARTUP] Checking for zones-import.json...');
  try {
    // Check if zones-import.json exists
    try {
      await fs.access(ZONES_IMPORT_FILE);
      console.log('[STARTUP] Found zones-import.json, processing...');
    } catch (error) {
      // File doesn't exist, skip auto-import
      console.log('[STARTUP] zones-import.json not found, skipping auto-import');
      return;
    }

    // Load zones from zones-import.json
    const zonesData = await fs.readFile(ZONES_IMPORT_FILE, 'utf-8');
    const zones = JSON.parse(zonesData);

    if (!Array.isArray(zones) || zones.length === 0) {
      return;
    }

    // Get or create default profile
    const profilesFilePath = getProfilesListPath();
    let profiles = [];
    let defaultProfile = null;

    try {
      const profilesData = await fs.readFile(profilesFilePath, 'utf-8');
      profiles = JSON.parse(profilesData);
      defaultProfile = profiles.find(p => p.id === 'default');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create default profile if it doesn't exist
    if (!defaultProfile) {
      defaultProfile = {
        id: 'default',
        name: 'Default Profile',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        zoneCount: 0,
      };
      profiles.push(defaultProfile);
      await fs.writeFile(profilesFilePath, JSON.stringify(profiles, null, 2), 'utf-8');
    }

    // Check if default profile already has zones
    const profileFilePath = getProfileFilePath('default');
    let hasZones = false;
    let existingZoneCount = 0;

    try {
      const existingZonesData = await fs.readFile(profileFilePath, 'utf-8');
      // Check if file is empty or whitespace only
      if (existingZonesData && existingZonesData.trim()) {
        try {
          const existingZones = JSON.parse(existingZonesData);
          hasZones = Array.isArray(existingZones) && existingZones.length > 0;
          existingZoneCount = hasZones ? existingZones.length : 0;
        } catch (parseError) {
          console.warn(`[STARTUP] JSON parse error for ${profileFilePath}:`, parseError.message);
          // Treat as empty zones
          hasZones = false;
          existingZoneCount = 0;
        }
      } else {
        // Empty file, treat as no zones
        hasZones = false;
        existingZoneCount = 0;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[STARTUP] Error reading ${profileFilePath}:`, error.message);
        // Treat as no zones
        hasZones = false;
        existingZoneCount = 0;
      }
    }

    // Always import/update zones from zones-import.json on startup
    await fs.writeFile(profileFilePath, JSON.stringify(zones, null, 2), 'utf-8');
    
    if (hasZones && existingZoneCount !== zones.length) {
      console.log('\n========================================');
      console.log(`[ZONE IMPORT] Updated zones: ${existingZoneCount} → ${zones.length} zones from zones-import.json`);
      console.log('========================================\n');
    } else if (!hasZones) {
      console.log('\n========================================');
      console.log(`[ZONE IMPORT] Auto-imported ${zones.length} zones from zones-import.json to default profile`);
      console.log('========================================\n');
    } else {
      console.log('\n========================================');
      console.log(`[ZONE IMPORT] Loaded ${zones.length} zones from zones-import.json`);
      console.log(`[ZONE IMPORT] Default profile already had ${existingZoneCount} zones - zones synced`);
      console.log('========================================\n');
    }
  } catch (error) {
    console.error('⚠️  Error during auto-import:', error.message);
    // Don't throw - server should still start even if auto-import fails
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Set UTF-8 charset for all JSON responses
app.use((req, res, next) => {
  // Override res.json to always include charset=utf-8
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(data);
  };
  next();
});

// Helper function to get profile file path
function getProfileFilePath(profileId) {
  return join(DATA_DIR, `profile-${profileId}.json`);
}

// Helper function to get profiles list file path
function getProfilesListPath() {
  return join(DATA_DIR, 'profiles.json');
}

// Load zones for a profile
app.get('/api/zones/:profileId', async (req, res) => {
  try {
    const {profileId} = req.params;
    const filePath = getProfileFilePath(profileId);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      // Check if file is empty or whitespace only
      if (!data || !data.trim()) {
        console.warn(`[ZONES] Empty file for profile ${profileId}, returning empty zones`);
        res.json({success: true, zones: []});
        return;
      }
      
      try {
        const zones = JSON.parse(data);
        // Ensure zones is an array
        if (!Array.isArray(zones)) {
          console.warn(`[ZONES] Invalid zones format for profile ${profileId}, returning empty zones`);
          res.json({success: true, zones: []});
          return;
        }
        res.json({success: true, zones});
      } catch (parseError) {
        console.error(`[ZONES] JSON parse error for profile ${profileId}:`, parseError.message);
        console.error(`[ZONES] File content preview: ${data.substring(0, 100)}`);
        // Return empty zones instead of crashing
        res.json({success: true, zones: []});
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - try auto-import for default profile
        if (profileId === 'default') {
          try {
            // Check if zones-import.json exists
            await fs.access(ZONES_IMPORT_FILE);
            
            // Load and import zones
            const zonesData = await fs.readFile(ZONES_IMPORT_FILE, 'utf-8');
            const zones = JSON.parse(zonesData);
            
            if (Array.isArray(zones) && zones.length > 0) {
              // Save zones to profile
              await fs.writeFile(filePath, JSON.stringify(zones, null, 2), 'utf-8');
              console.log(`✅ Auto-imported ${zones.length} zones from zones-import.json on request`);
              res.json({success: true, zones});
              return;
            }
          } catch (importError) {
            // zones-import.json doesn't exist or error reading it - continue to return empty zones
          }
        }
        
        // Return empty zones if no auto-import happened
        res.json({success: true, zones: []});
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading zones:', error);
    res.status(500).json({success: false, error: 'Failed to load zones'});
  }
});

// Save zones for a profile
app.post('/api/zones/:profileId', async (req, res) => {
  try {
    const {profileId} = req.params;
    const {zones} = req.body;
    
    if (!Array.isArray(zones)) {
      return res.status(400).json({success: false, error: 'Zones must be an array'});
    }
    
    const filePath = getProfileFilePath(profileId);
    await fs.writeFile(filePath, JSON.stringify(zones, null, 2), 'utf-8');
    
    res.json({success: true, message: 'Zones saved successfully'});
  } catch (error) {
    console.error('Error saving zones:', error);
    res.status(500).json({success: false, error: 'Failed to save zones'});
  }
});

// Get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const filePath = getProfilesListPath();
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      // Check if file is empty or whitespace only
      if (!data || !data.trim()) {
        console.warn('[PROFILES] Empty profiles.json file, initializing with default profile');
        const defaultProfile = {
          id: 'default',
          name: 'Default Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          zoneCount: 0,
        };
        await fs.writeFile(filePath, JSON.stringify([defaultProfile], null, 2), 'utf-8');
        res.json({success: true, profiles: [defaultProfile]});
        return;
      }
      
      try {
        const profiles = JSON.parse(data);
        // Ensure profiles is an array
        if (!Array.isArray(profiles)) {
          console.warn('[PROFILES] Invalid profiles format, initializing with default profile');
          const defaultProfile = {
            id: 'default',
            name: 'Default Profile',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            zoneCount: 0,
          };
          await fs.writeFile(filePath, JSON.stringify([defaultProfile], null, 2), 'utf-8');
          res.json({success: true, profiles: [defaultProfile]});
          return;
        }
        res.json({success: true, profiles});
      } catch (parseError) {
        console.error('[PROFILES] JSON parse error:', parseError.message);
        console.error(`[PROFILES] File content preview: ${data.substring(0, 100)}`);
        // Initialize with default profile instead of crashing
        const defaultProfile = {
          id: 'default',
          name: 'Default Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          zoneCount: 0,
        };
        await fs.writeFile(filePath, JSON.stringify([defaultProfile], null, 2), 'utf-8');
        res.json({success: true, profiles: [defaultProfile]});
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // No profiles file, return default profile
        const defaultProfile = {
          id: 'default',
          name: 'Default Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          zoneCount: 0,
        };
        await fs.writeFile(filePath, JSON.stringify([defaultProfile], null, 2), 'utf-8');
        res.json({success: true, profiles: [defaultProfile]});
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading profiles:', error);
    res.status(500).json({success: false, error: 'Failed to load profiles'});
  }
});

// Create a new profile
app.post('/api/profiles', async (req, res) => {
  try {
    const {name} = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({success: false, error: 'Profile name is required'});
    }
    
    const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const profile = {
      id: profileId,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      zoneCount: 0,
    };
    
    const filePath = getProfilesListPath();
    let profiles = [];
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      profiles = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    profiles.push(profile);
    await fs.writeFile(filePath, JSON.stringify(profiles, null, 2), 'utf-8');
    
    res.json({success: true, profile});
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({success: false, error: 'Failed to create profile'});
  }
});

// Update a profile
app.put('/api/profiles/:profileId', async (req, res) => {
  try {
    const {profileId} = req.params;
    const updates = req.body;
    
    const filePath = getProfilesListPath();
    let data;
    let profiles;
    
    try {
      data = await fs.readFile(filePath, 'utf-8');
      // Check if file is empty or whitespace only
      if (!data || !data.trim()) {
        console.warn('[PROFILES] Empty profiles.json file, initializing with default profile');
        profiles = [{
          id: 'default',
          name: 'Default Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          zoneCount: 0,
        }];
      } else {
        try {
          profiles = JSON.parse(data);
          // Ensure profiles is an array
          if (!Array.isArray(profiles)) {
            console.warn('[PROFILES] Invalid profiles format, initializing with default profile');
            profiles = [{
              id: 'default',
              name: 'Default Profile',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              zoneCount: 0,
            }];
          }
        } catch (parseError) {
          console.error('[PROFILES] JSON parse error:', parseError.message);
          console.error(`[PROFILES] File content preview: ${data.substring(0, 100)}`);
          // Initialize with default profile instead of crashing
          profiles = [{
            id: 'default',
            name: 'Default Profile',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            zoneCount: 0,
          }];
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create default profile
        profiles = [{
          id: 'default',
          name: 'Default Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          zoneCount: 0,
        }];
      } else {
        throw error;
      }
    }
    
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) {
      return res.status(404).json({success: false, error: 'Profile not found'});
    }
    
    profiles[profileIndex] = {
      ...profiles[profileIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await fs.writeFile(filePath, JSON.stringify(profiles, null, 2), 'utf-8');
    
    res.json({success: true, profile: profiles[profileIndex]});
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({success: false, error: 'Failed to update profile'});
  }
});

// Delete a profile
app.delete('/api/profiles/:profileId', async (req, res) => {
  try {
    const {profileId} = req.params;
    
    // Delete profile from list
    const filePath = getProfilesListPath();
    const data = await fs.readFile(filePath, 'utf-8');
    const profiles = JSON.parse(data);
    
    const filteredProfiles = profiles.filter(p => p.id !== profileId);
    if (filteredProfiles.length === profiles.length) {
      return res.status(404).json({success: false, error: 'Profile not found'});
    }
    
    await fs.writeFile(filePath, JSON.stringify(filteredProfiles, null, 2), 'utf-8');
    
    // Delete zones file for this profile
    const zonesFilePath = getProfileFilePath(profileId);
    try {
      await fs.unlink(zonesFilePath);
    } catch (error) {
      // File might not exist, that's okay
    }
    
    res.json({success: true, message: 'Profile deleted successfully'});
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({success: false, error: 'Failed to delete profile'});
  }
});

// Root endpoint - show available API endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KWC Beat App API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      profiles: {
        list: 'GET /api/profiles',
        create: 'POST /api/profiles',
        update: 'PUT /api/profiles/:profileId',
        delete: 'DELETE /api/profiles/:profileId',
      },
      zones: {
        get: 'GET /api/zones/:profileId',
        save: 'POST /api/zones/:profileId',
      },
    },
    example: 'Try: http://localhost:3001/api/profiles',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({success: true, message: 'Server is running'});
});

// Auto-import zones on startup
console.log('\n========================================');
console.log('Starting KWC Beat App Backend Server...');
console.log('========================================\n');
await autoImportZones();

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log('========================================\n');
});
