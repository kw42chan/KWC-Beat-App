export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  zoneCount?: number; // Optional: cached zone count
}

export interface ProfileWithZones extends Profile {
  zones: any[]; // Zone[] but avoiding circular import
}
