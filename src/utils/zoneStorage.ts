import {Zone} from '../types/zone';
import {Profile} from '../types/profile';
// Import default zones that will be bundled with the app
import defaultZonesData from '../data/default-zones.json';

const DB_NAME = 'kwc-beat-app';
const DB_VERSION = 2; // Incremented for profile support
const ZONES_STORE = 'zones';
const PROFILES_STORE = 'profiles';
const CURRENT_PROFILE_KEY = 'current-profile-id';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '';
const USE_SERVER = API_URL !== '';

/**
 * Check if server API is available
 */
function isServerAvailable(): boolean {
  return USE_SERVER;
}

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!USE_SERVER) {
    throw new Error('API URL not configured');
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({error: 'Unknown error'}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Initialize IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ZONES_STORE)) {
        db.createObjectStore(ZONES_STORE);
      }
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        db.createObjectStore(PROFILES_STORE);
      }
    };
  });
}

/**
 * Get current profile ID
 */
export function getCurrentProfileId(): string {
  try {
    return localStorage.getItem(CURRENT_PROFILE_KEY) || 'default';
  } catch {
    return 'default';
  }
}

/**
 * Set current profile ID
 */
export function setCurrentProfileId(profileId: string): void {
  try {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
  } catch (error) {
    console.error('Failed to save current profile ID:', error);
  }
}

/**
 * Save zones to server or IndexedDB for a specific profile
 */
export async function saveZonesToDB(zones: Zone[], profileId?: string): Promise<void> {
  const currentProfileId = profileId || getCurrentProfileId();
  
  // Try server first if configured
  if (isServerAvailable()) {
    try {
      await apiRequest(`/api/zones/${currentProfileId}`, {
        method: 'POST',
        body: JSON.stringify({zones}),
      });
      // Update profile zone count on server
      await updateProfile(currentProfileId, {zoneCount: zones.length}).catch(() => {
        // Ignore errors updating profile count
      });
      return;
    } catch (error) {
      console.error('Failed to save zones to server, falling back to local storage:', error);
      // Fall through to local storage fallback
    }
  }
  
  // Fallback to IndexedDB/localStorage
  try {
    const db = await openDB();
    const transaction = db.transaction([ZONES_STORE], 'readwrite');
    const store = transaction.objectStore(ZONES_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(zones, `zones-${currentProfileId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Update profile's updatedAt timestamp and zone count
    await updateProfileTimestamp(currentProfileId, zones.length);
    
    db.close();
  } catch (error) {
    console.error('Failed to save zones to IndexedDB:', error);
    // Fallback to localStorage
    if (zones.length > 0) {
      localStorage.setItem(`kwc-beat-zones-${currentProfileId}`, JSON.stringify(zones));
    } else {
      localStorage.removeItem(`kwc-beat-zones-${currentProfileId}`);
    }
  }
}

/**
 * Load zones from server or IndexedDB for a specific profile
 */
export async function loadZonesFromDB(profileId?: string): Promise<Zone[] | null> {
  const currentProfileId = profileId || getCurrentProfileId();
  
  // Try server first if configured
  if (isServerAvailable()) {
    try {
      console.log(`[ZoneStorage] Loading zones from server: ${API_URL}/api/zones/${currentProfileId}`);
      const response = await apiRequest(`/api/zones/${currentProfileId}`);
      console.log(`[ZoneStorage] Server response:`, response);
      if (response.success && Array.isArray(response.zones)) {
        console.log(`[ZoneStorage] Loaded ${response.zones.length} zones from server`);
        return response.zones;
      }
      console.warn(`[ZoneStorage] Server response missing zones:`, response);
      return null;
    } catch (error) {
      console.error('[ZoneStorage] Failed to load zones from server, falling back to local storage:', error);
      // Fall through to local storage fallback
    }
  } else {
    console.log('[ZoneStorage] Server not configured, using local storage');
  }
  
  // Fallback to IndexedDB/localStorage
  try {
    const db = await openDB();
    const transaction = db.transaction([ZONES_STORE], 'readonly');
    const store = transaction.objectStore(ZONES_STORE);
    
    const zones = await new Promise<Zone[] | null>((resolve, reject) => {
      const request = store.get(`zones-${currentProfileId}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    // If no zones in IndexedDB, try localStorage fallback
    if (!zones) {
      try {
        const savedZones = localStorage.getItem(`kwc-beat-zones-${currentProfileId}`);
        if (savedZones) {
          console.log(`[ZoneStorage] Found zones in localStorage for profile ${currentProfileId}`);
          return JSON.parse(savedZones);
        }
      } catch (e) {
        console.warn('[ZoneStorage] Failed to load from localStorage:', e);
      }
    }
    
    // If no zones found and this is the default profile, load default zones
    if (!zones && currentProfileId === 'default') {
      console.log('[ZoneStorage] No zones found, loading default zones');
      const defaultZones = (defaultZonesData as Zone[]).map(zone => ({
        ...zone,
        visible: zone.visible !== undefined ? zone.visible : true,
        locked: zone.locked !== undefined ? zone.locked : false,
      }));
      
      // Save default zones to storage for future use
      try {
        await saveZonesToDB(defaultZones, currentProfileId);
        console.log(`[ZoneStorage] Loaded and saved ${defaultZones.length} default zones`);
      } catch (saveError) {
        console.warn('[ZoneStorage] Failed to save default zones, returning them anyway:', saveError);
      }
      
      return defaultZones;
    }
    
    // For non-default profiles, return empty array instead of null if no zones found
    // This prevents undefined behavior in the UI
    if (!zones) {
      return [];
    }
    
    return zones;
  } catch (error) {
    console.error('Failed to load zones from IndexedDB:', error);
    // Fallback to localStorage
    try {
      const savedZones = localStorage.getItem(`kwc-beat-zones-${currentProfileId}`);
      if (savedZones) {
        return JSON.parse(savedZones);
      }
      
      // If no saved zones and this is default profile, return default zones
      if (currentProfileId === 'default') {
        console.log('[ZoneStorage] No zones in localStorage, loading default zones');
        const defaultZones = (defaultZonesData as Zone[]).map(zone => ({
          ...zone,
          visible: zone.visible !== undefined ? zone.visible : true,
          locked: zone.locked !== undefined ? zone.locked : false,
        }));
        
        // Try to save to localStorage
        try {
          localStorage.setItem(`kwc-beat-zones-${currentProfileId}`, JSON.stringify(defaultZones));
        } catch (saveError) {
          console.warn('[ZoneStorage] Failed to save default zones to localStorage:', saveError);
        }
        
        return defaultZones;
      }
      
      return null;
    } catch {
      // If all else fails and this is default profile, return default zones
      if (currentProfileId === 'default') {
        console.log('[ZoneStorage] All storage methods failed, returning default zones');
        return (defaultZonesData as Zone[]).map(zone => ({
          ...zone,
          visible: zone.visible !== undefined ? zone.visible : true,
          locked: zone.locked !== undefined ? zone.locked : false,
        }));
      }
      return null;
    }
  }
}

/**
 * Create a new profile on server or locally
 */
export async function createProfile(name: string): Promise<Profile> {
  // Try server first if configured
  if (isServerAvailable()) {
    try {
      const response = await apiRequest('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({name}),
      });
      if (response.success && response.profile) {
        return response.profile;
      }
    } catch (error) {
      console.error('Failed to create profile on server, falling back to local storage:', error);
      // Fall through to local storage fallback
    }
  }
  
  // Fallback to IndexedDB/localStorage
  const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const profile: Profile = {
    id: profileId,
    name,
    createdAt: now,
    updatedAt: now,
    zoneCount: 0,
  };
  
  try {
    const db = await openDB();
    const transaction = db.transaction([PROFILES_STORE], 'readwrite');
    const store = transaction.objectStore(PROFILES_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(profile, profileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return profile;
  } catch (error) {
    console.error('Failed to create profile in IndexedDB:', error);
    // Fallback to localStorage
    const profiles = getAllProfilesFromLocalStorage();
    profiles.push(profile);
    localStorage.setItem('kwc-beat-profiles', JSON.stringify(profiles));
    return profile;
  }
}

/**
 * Get all profiles from server or IndexedDB
 */
export async function getAllProfiles(): Promise<Profile[]> {
  // Try server first if configured
  if (isServerAvailable()) {
    try {
      const response = await apiRequest('/api/profiles');
      if (response.success && Array.isArray(response.profiles)) {
        return response.profiles;
      }
    } catch (error) {
      console.error('Failed to load profiles from server, falling back to local storage:', error);
      // Fall through to local storage fallback
    }
  }
  
  // Fallback to IndexedDB/localStorage
  try {
    const db = await openDB();
    const transaction = db.transaction([PROFILES_STORE], 'readonly');
    const store = transaction.objectStore(PROFILES_STORE);
    
    const profiles = await new Promise<Profile[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as Profile[];
        // If no profiles exist, create a default one
        if (results.length === 0) {
          const defaultProfile: Profile = {
            id: 'default',
            name: 'Default Profile',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            zoneCount: 0,
          };
          resolve([defaultProfile]);
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return profiles;
  } catch (error) {
    console.error('Failed to load profiles from IndexedDB:', error);
    // Fallback to localStorage
    return getAllProfilesFromLocalStorage();
  }
}

/**
 * Get profiles from localStorage (fallback)
 */
function getAllProfilesFromLocalStorage(): Profile[] {
  try {
    const saved = localStorage.getItem('kwc-beat-profiles');
    if (saved) {
      return JSON.parse(saved);
    }
    // Create default profile if none exist
    const defaultProfile: Profile = {
      id: 'default',
      name: 'Default Profile',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      zoneCount: 0,
    };
    localStorage.setItem('kwc-beat-profiles', JSON.stringify([defaultProfile]));
    return [defaultProfile];
  } catch {
    return [];
  }
}

/**
 * Update profile timestamp and zone count
 */
async function updateProfileTimestamp(profileId: string, zoneCount?: number): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([PROFILES_STORE], 'readwrite');
    const store = transaction.objectStore(PROFILES_STORE);
    
    const profile = await new Promise<Profile | null>((resolve, reject) => {
      const request = store.get(profileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    if (profile) {
      profile.updatedAt = new Date().toISOString();
      if (zoneCount !== undefined) {
        profile.zoneCount = zoneCount;
      }
      await new Promise<void>((resolve, reject) => {
        const request = store.put(profile, profileId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    db.close();
  } catch (error) {
    console.error('Failed to update profile timestamp:', error);
  }
}

/**
 * Delete a profile from server or locally
 */
export async function deleteProfile(profileId: string): Promise<void> {
  // Try server first if configured
  if (isServerAvailable()) {
    try {
      await apiRequest(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });
      return;
    } catch (error) {
      console.error('Failed to delete profile on server, falling back to local storage:', error);
      // Fall through to local storage fallback
    }
  }
  
  // Fallback to IndexedDB/localStorage
  try {
    const db = await openDB();
    const transaction = db.transaction([PROFILES_STORE, ZONES_STORE], 'readwrite');
    const profilesStore = transaction.objectStore(PROFILES_STORE);
    const zonesStore = transaction.objectStore(ZONES_STORE);
    
    // Delete profile
    await new Promise<void>((resolve, reject) => {
      const request = profilesStore.delete(profileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Delete zones for this profile
    await new Promise<void>((resolve, reject) => {
      const request = zonesStore.delete(`zones-${profileId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to delete profile:', error);
    // Fallback to localStorage
    const profiles = getAllProfilesFromLocalStorage().filter(p => p.id !== profileId);
    localStorage.setItem('kwc-beat-profiles', JSON.stringify(profiles));
    localStorage.removeItem(`kwc-beat-zones-${profileId}`);
  }
}

/**
 * Update profile on server or locally
 */
export async function updateProfile(profileId: string, updates: Partial<Profile>): Promise<void> {
  // Try server first if configured
  if (isServerAvailable()) {
    try {
      await apiRequest(`/api/profiles/${profileId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return;
    } catch (error) {
      console.error('Failed to update profile on server, falling back to local storage:', error);
      // Fall through to local storage fallback
    }
  }
  
  // Fallback to IndexedDB/localStorage
  try {
    const db = await openDB();
    const transaction = db.transaction([PROFILES_STORE], 'readwrite');
    const store = transaction.objectStore(PROFILES_STORE);
    
    const profile = await new Promise<Profile | null>((resolve, reject) => {
      const request = store.get(profileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    if (profile) {
      Object.assign(profile, updates);
      profile.updatedAt = new Date().toISOString();
      await new Promise<void>((resolve, reject) => {
        const request = store.put(profile, profileId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    db.close();
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
}

/**
 * Export zones to a downloadable JSON file (includes profile info)
 */
export function exportZonesToFile(zones: Zone[], profileName?: string): void {
  const profileId = getCurrentProfileId();
  const exportData = {
    profileId,
    profileName: profileName || 'Unknown Profile',
    exportedAt: new Date().toISOString(),
    zones,
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  const fileName = profileName 
    ? `zones-${profileName.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json`
    : `zones-${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Load zones from a file (supports both old format and new profile format)
 */
export function loadZonesFromFile(file: File): Promise<Zone[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        // Handle both old format (array) and new format (object with profile info)
        let zones: Zone[] = [];
        if (Array.isArray(data)) {
          // Old format: direct array
          zones = data;
        } else if (data.zones && Array.isArray(data.zones)) {
          // New format: object with zones array
          zones = data.zones;
        } else {
          reject(new Error('Invalid file format: Expected an array of zones or object with zones property'));
          return;
        }
        
        if (!Array.isArray(zones) || zones.length === 0) {
          // Empty array is valid
          resolve([]);
          return;
        }
        
        // Normalize zones
        const normalizedZones = zones.map(zone => ({
          ...zone,
          visible: zone.visible !== undefined ? zone.visible : true,
          locked: zone.locked !== undefined ? zone.locked : false,
        }));
        
        resolve(normalizedZones);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse JSON'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
