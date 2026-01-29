import {Zone} from '../types/zone';

// Vibrant color palette with high visibility
// Colors are selected to be distinct and easily distinguishable
const VIBRANT_COLORS = [
  { name: 'Red', light: 'rgba(255, 59, 48, 0.55)', dark: 'rgba(255, 69, 58, 0.65)', hue: 0 },
  { name: 'Blue', light: 'rgba(0, 122, 255, 0.55)', dark: 'rgba(10, 132, 255, 0.65)', hue: 210 },
  { name: 'Green', light: 'rgba(52, 199, 89, 0.55)', dark: 'rgba(48, 209, 88, 0.65)', hue: 120 },
  { name: 'Orange', light: 'rgba(255, 149, 0, 0.55)', dark: 'rgba(255, 159, 10, 0.65)', hue: 30 },
  { name: 'Purple', light: 'rgba(175, 82, 222, 0.55)', dark: 'rgba(191, 90, 242, 0.65)', hue: 270 },
  { name: 'Teal', light: 'rgba(48, 176, 199, 0.55)', dark: 'rgba(64, 200, 224, 0.65)', hue: 180 },
  { name: 'Yellow', light: 'rgba(255, 204, 0, 0.55)', dark: 'rgba(255, 214, 10, 0.65)', hue: 50 },
  { name: 'Pink', light: 'rgba(255, 45, 85, 0.55)', dark: 'rgba(255, 55, 95, 0.65)', hue: 340 },
  { name: 'Indigo', light: 'rgba(88, 86, 214, 0.55)', dark: 'rgba(94, 92, 230, 0.65)', hue: 240 },
  { name: 'Cyan', light: 'rgba(90, 200, 250, 0.55)', dark: 'rgba(100, 210, 255, 0.65)', hue: 195 },
  { name: 'Lime', light: 'rgba(142, 205, 50, 0.55)', dark: 'rgba(162, 225, 60, 0.65)', hue: 85 },
  { name: 'Magenta', light: 'rgba(255, 0, 255, 0.55)', dark: 'rgba(255, 20, 255, 0.65)', hue: 300 },
] as const;

/**
 * Check if two zones are adjacent (share boundaries or are very close)
 */
export function areZonesAdjacent(zone1: Zone, zone2: Zone): boolean {
  // Check if bounding boxes overlap or are very close
  const buffer = 0.0001; // Small buffer for floating point comparison
  
  const overlapLat = !(zone1.maxLat + buffer < zone2.minLat - buffer || 
                       zone2.maxLat + buffer < zone1.minLat - buffer);
  const overlapLng = !(zone1.maxLng + buffer < zone2.minLng - buffer || 
                       zone2.maxLng + buffer < zone1.minLng - buffer);
  
  return overlapLat && overlapLng;
}

/**
 * Build adjacency map for all zones
 */
export function buildAdjacencyMap(zones: Zone[]): Map<number, number[]> {
  const adjacencyMap = new Map<number, number[]>();
  
  for (const zone of zones) {
    adjacencyMap.set(zone.id, []);
  }
  
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      if (areZonesAdjacent(zones[i], zones[j])) {
        adjacencyMap.get(zones[i].id)?.push(zones[j].id);
        adjacencyMap.get(zones[j].id)?.push(zones[i].id);
      }
    }
  }
  
  return adjacencyMap;
}

/**
 * Assign colors to zones ensuring adjacent zones have contrasting colors
 * Uses a greedy graph coloring algorithm
 */
export function assignZoneColors(zones: Zone[], isDarkMode: boolean = false): Map<number, string> {
  if (zones.length === 0) {
    return new Map();
  }
  
  const adjacencyMap = buildAdjacencyMap(zones);
  const colorAssignments = new Map<number, string>();
  
  // Sort zones by number of adjacent zones (most connected first)
  const sortedZones = [...zones].sort((a, b) => {
    const aAdjacent = adjacencyMap.get(a.id)?.length || 0;
    const bAdjacent = adjacencyMap.get(b.id)?.length || 0;
    return bAdjacent - aAdjacent;
  });
  
  for (const zone of sortedZones) {
    const adjacentZones = adjacencyMap.get(zone.id) || [];
    const usedColors = new Set<string>();
    
    // Collect colors used by adjacent zones
    for (const adjacentId of adjacentZones) {
      const adjacentColor = colorAssignments.get(adjacentId);
      if (adjacentColor) {
        usedColors.add(adjacentColor);
      }
    }
    
    // Find the first color not used by adjacent zones
    // Prioritize colors with different hue values for better contrast
    let bestColor: string | null = null;
    let bestScore = -1;
    
    for (const colorInfo of VIBRANT_COLORS) {
      const color = isDarkMode ? colorInfo.dark : colorInfo.light;
      
      if (!usedColors.has(color)) {
        // Calculate contrast score based on hue difference with adjacent colors
        let minHueDiff = Infinity;
        for (const adjacentId of adjacentZones) {
          const adjacentColor = colorAssignments.get(adjacentId);
          if (adjacentColor) {
            const adjacentColorInfo = VIBRANT_COLORS.find(c => 
              c.light === adjacentColor || c.dark === adjacentColor
            );
            if (adjacentColorInfo) {
              const hueDiff = Math.abs(colorInfo.hue - adjacentColorInfo.hue);
              const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
              minHueDiff = Math.min(minHueDiff, normalizedDiff);
            }
          }
        }
        
        // Score favors colors with larger hue differences from adjacent zones
        const score = minHueDiff === Infinity ? 180 : minHueDiff;
        
        if (score > bestScore) {
          bestScore = score;
          bestColor = color;
        }
      }
    }
    
    // If all colors are used (shouldn't happen with 12 colors), pick least used
    if (!bestColor) {
      const colorUsage = new Map<string, number>();
      for (const colorInfo of VIBRANT_COLORS) {
        const color = isDarkMode ? colorInfo.dark : colorInfo.light;
        colorUsage.set(color, 0);
      }
      
      for (const adjacentId of adjacentZones) {
        const adjacentColor = colorAssignments.get(adjacentId);
        if (adjacentColor) {
          colorUsage.set(adjacentColor, (colorUsage.get(adjacentColor) || 0) + 1);
        }
      }
      
      let minUsage = Infinity;
      for (const [color, usage] of colorUsage) {
        if (usage < minUsage) {
          minUsage = usage;
          bestColor = color;
        }
      }
    }
    
    colorAssignments.set(zone.id, bestColor || VIBRANT_COLORS[0].light);
  }
  
  return colorAssignments;
}

// Cache for color assignments
let colorAssignmentCache: Map<number, string> | null = null;
let lastZonesHash: string = '';

/**
 * Generate a hash of zones for cache invalidation
 */
function generateZonesHash(zones: Zone[]): string {
  return zones.map(z => `${z.id}-${z.centerLat.toFixed(6)}-${z.centerLng.toFixed(6)}`).join('|');
}

/**
 * Generate a color for a zone based on its ID or custom color
 * Uses contrasting colors for adjacent zones
 */
export function generateZoneColor(zone: Zone | number, isDarkMode: boolean = false, allZones?: Zone[]): string {
  // If zone object is passed and has custom color, use it
  if (typeof zone === 'object' && zone.color) {
    return zone.color;
  }
  
  const zoneId = typeof zone === 'object' ? zone.id : zone;
  
  // If we have all zones, use the adjacency-aware coloring
  if (allZones && allZones.length > 0) {
    const zonesHash = generateZonesHash(allZones);
    
    // Invalidate cache if zones changed
    if (zonesHash !== lastZonesHash || !colorAssignmentCache) {
      colorAssignmentCache = assignZoneColors(allZones, isDarkMode);
      lastZonesHash = zonesHash;
    }
    
    const assignedColor = colorAssignmentCache.get(zoneId);
    if (assignedColor) {
      return assignedColor;
    }
  }
  
  // Fallback to ID-based coloring
  const colors = VIBRANT_COLORS.map(c => isDarkMode ? c.dark : c.light);
  return colors[zoneId % colors.length];
}

/**
 * Reset color assignment cache
 * Call this when zones are added, removed, or significantly changed
 */
export function resetColorCache(): void {
  colorAssignmentCache = null;
  lastZonesHash = '';
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
