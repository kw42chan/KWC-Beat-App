export interface Zone {
  id: number;
  name: string;
  coordinates: Array<{lat: number; lng: number}>; // Polygon coordinates
  minLat: number; // Calculated from coordinates
  maxLat: number; // Calculated from coordinates
  minLng: number; // Calculated from coordinates
  maxLng: number; // Calculated from coordinates
  centerLat: number; // Calculated: (minLat + maxLat) / 2
  centerLng: number; // Calculated: (minLng + maxLng) / 2
  color?: string; // Optional custom color (rgba format)
  description?: string; // Optional notes/description
  visible?: boolean; // Visibility toggle (default: true)
  locked?: boolean; // Lock status (default: false)
  createdAt?: string; // Creation timestamp (ISO string)
  updatedAt?: string; // Last update timestamp (ISO string)
}

