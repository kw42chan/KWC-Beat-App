import {Zone} from '../types/zone';

/**
 * Generate a color for a zone based on its ID or custom color
 * Cycles through a palette of 12 distinct colors if no custom color is set
 */
export function generateZoneColor(zone: Zone | number, isDarkMode: boolean = false): string {
  // If zone object is passed and has custom color, use it
  if (typeof zone === 'object' && zone.color) {
    return zone.color;
  }
  
  // Otherwise, use zone ID to generate color
  const zoneId = typeof zone === 'object' ? zone.id : zone;
  const lightColors = [
    'rgba(255, 99, 132, 0.5)',   // Red
    'rgba(54, 162, 235, 0.5)',   // Blue
    'rgba(255, 206, 86, 0.5)',   // Yellow
    'rgba(75, 192, 192, 0.5)',   // Teal
    'rgba(153, 102, 255, 0.5)',  // Purple
    'rgba(255, 159, 64, 0.5)',   // Orange
    'rgba(199, 199, 199, 0.5)',  // Grey
    'rgba(83, 102, 255, 0.5)',   // Indigo
    'rgba(255, 99, 255, 0.5)',   // Magenta
    'rgba(99, 255, 132, 0.5)',   // Green
    'rgba(255, 205, 86, 0.5)',   // Gold
    'rgba(54, 162, 235, 0.5)',   // Sky Blue
  ];

  const darkColors = [
    'rgba(255, 150, 180, 0.6)',  // Lighter Red
    'rgba(100, 200, 255, 0.6)',  // Lighter Blue
    'rgba(255, 230, 150, 0.6)',  // Lighter Yellow
    'rgba(120, 230, 230, 0.6)',  // Lighter Teal
    'rgba(200, 150, 255, 0.6)',  // Lighter Purple
    'rgba(255, 200, 120, 0.6)',  // Lighter Orange
    'rgba(230, 230, 230, 0.6)',  // Light Grey
    'rgba(150, 170, 255, 0.6)',  // Lighter Indigo
    'rgba(255, 150, 255, 0.6)',  // Lighter Magenta
    'rgba(150, 255, 180, 0.6)',  // Lighter Green
    'rgba(255, 230, 150, 0.6)',  // Lighter Gold
    'rgba(100, 200, 255, 0.6)',  // Lighter Sky Blue
  ];

  const colors = isDarkMode ? darkColors : lightColors;
  return colors[zoneId % colors.length];
}

/**
 * Calculate the center coordinates of a zone
 */
export function calculateZoneCenter(zone: Zone): {latitude: number; longitude: number} {
  return {
    latitude: zone.centerLat,
    longitude: zone.centerLng,
  };
}

/**
 * Get the bounding box that contains all zones
 */
export function getAllZonesBounds(zones: Zone[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  if (zones.length === 0) {
    return {
      minLat: 22.362718,
      maxLat: 22.362718,
      minLng: 114.128100,
      maxLng: 114.128100,
    };
  }

  let minLat = zones[0].minLat;
  let maxLat = zones[0].maxLat;
  let minLng = zones[0].minLng;
  let maxLng = zones[0].maxLng;

  zones.forEach(zone => {
    minLat = Math.min(minLat, zone.minLat);
    maxLat = Math.max(maxLat, zone.maxLat);
    minLng = Math.min(minLng, zone.minLng);
    maxLng = Math.max(maxLng, zone.maxLng);
  });

  return {minLat, maxLat, minLng, maxLng};
}

/**
 * Calculate bounding box and center from polygon coordinates
 */
export function calculateZoneBounds(coordinates: Array<{lat: number; lng: number}>): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
} {
  if (coordinates.length === 0) {
    return {
      minLat: 0,
      maxLat: 0,
      minLng: 0,
      maxLng: 0,
      centerLat: 0,
      centerLng: 0,
    };
  }

  const lats = coordinates.map(c => c.lat);
  const lngs = coordinates.map(c => c.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
  };
}

/**
 * Create zone from polygon coordinates
 */
export function createZoneFromPolygon(
  id: number,
  name: string,
  coordinates: Array<{lat: number; lng: number}>,
): Zone {
  const bounds = calculateZoneBounds(coordinates);
  return {
    id,
    name,
    coordinates,
    ...bounds,
  };
}

