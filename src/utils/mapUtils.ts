import {Zone} from '../types/zone';
import {getAllZonesBounds} from './zoneUtils';

/**
 * Create a center point and zoom level that fits all zones
 */
export function createMapViewForZones(zones: Zone[], padding: number = 0.1): {
  center: {lat: number; lng: number};
  zoom: number;
} {
  const bounds = getAllZonesBounds(zones);

  const latDelta = bounds.maxLat - bounds.minLat;
  const lngDelta = bounds.maxLng - bounds.minLng;

  // Add padding
  const paddedLatDelta = latDelta * (1 + padding * 2);
  const paddedLngDelta = lngDelta * (1 + padding * 2);

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;

  // Calculate zoom level (approximate)
  const maxDelta = Math.max(paddedLatDelta, paddedLngDelta);
  const zoom = Math.min(18, Math.max(10, Math.floor(-Math.log2(maxDelta) + 10)));

  return {
    center: {lat: centerLat, lng: centerLng},
    zoom,
  };
}
