import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const ZONES_FILE = join(__dirname, '..', 'zones-import.json');

// Load zones from JSON file
function loadZones() {
  try {
    const data = fs.readFileSync(ZONES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading zones file: ${error.message}`);
    process.exit(1);
  }
}

// Get or create a profile
async function getOrCreateProfile(profileName = 'Imported Zones Profile') {
  try {
    // Try to get existing profiles
    const response = await fetch(`${API_URL}/api/profiles`);
    const result = await response.json();
    
    if (result.success && result.profiles && result.profiles.length > 0) {
      // Use the first profile
      console.log(`📁 Using existing profile: ${result.profiles[0].name} (${result.profiles[0].id})`);
      return result.profiles[0];
    }
    
    // Create a new profile
    console.log(`📝 Creating new profile: ${profileName}`);
    const createResponse = await fetch(`${API_URL}/api/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name: profileName}),
    });
    
    const createResult = await createResponse.json();
    if (createResult.success) {
      console.log(`✅ Created profile: ${createResult.profile.name} (${createResult.profile.id})`);
      return createResult.profile;
    } else {
      throw new Error(createResult.error || 'Failed to create profile');
    }
  } catch (error) {
    console.error(`❌ Error getting/creating profile: ${error.message}`);
    throw error;
  }
}

// Upload zones to backend
async function uploadZones(profileId, zones) {
  try {
    console.log(`📤 Uploading ${zones.length} zones to profile ${profileId}...`);
    
    const response = await fetch(`${API_URL}/api/zones/${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({zones}),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully uploaded ${zones.length} zones to backend!`);
      return true;
    } else {
      throw new Error(result.error || 'Failed to upload zones');
    }
  } catch (error) {
    console.error(`❌ Error uploading zones: ${error.message}`);
    throw error;
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting zone upload to backend...\n');
  
  // Check if server is running
  console.log(`🔍 Checking if backend server is running at ${API_URL}...`);
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error(`❌ Backend server is not running at ${API_URL}`);
    console.error(`   Please start the server with: cd server && npm start`);
    process.exit(1);
  }
  
  console.log(`✅ Backend server is running\n`);
  
  // Load zones
  console.log(`📖 Loading zones from ${ZONES_FILE}...`);
  const zones = loadZones();
  console.log(`✅ Loaded ${zones.length} zones\n`);
  
  // Get or create profile
  const profile = await getOrCreateProfile();
  console.log();
  
  // Upload zones
  await uploadZones(profile.id, zones);
  
  console.log(`\n✨ All done! Zones are now saved in the backend.`);
  console.log(`   Profile: ${profile.name} (${profile.id})`);
  console.log(`   Zones: ${zones.length}`);
  console.log(`   Backend URL: ${API_URL}`);
}

main().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
