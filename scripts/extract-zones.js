/**
 * Zone Data Extraction Script
 * 
 * This script helps extract zone coordinates from Google Maps KML files
 * and converts them to the JSON format required by the app.
 * 
 * Usage:
 * 1. Export KML from Google My Maps
 * 2. Save it as zones.kml in the scripts directory
 * 3. Run: npm run extract-zones
 * 4. The output will be written to src/data/zones.json
 */

const fs = require('fs');
const path = require('path');
const {DOMParser} = require('@xmldom/xmldom');

const KML_FILE = path.join(__dirname, 'zones.kml');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'zones.json');

function parseKML(kmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlContent, 'text/xml');
  
  const placemarks = doc.getElementsByTagName('Placemark');
  const zones = [];

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    
    // Extract name
    const nameElement = placemark.getElementsByTagName('name')[0];
    const name = nameElement ? nameElement.textContent.trim() : `Zone ${i + 1}`;
    
    // Extract coordinates
    const coordinatesElement = placemark.getElementsByTagName('coordinates')[0];
    if (!coordinatesElement) continue;
    
    const coordsText = coordinatesElement.textContent.trim();
    const coords = coordsText.split(/\s+/).map(coord => {
      const [lng, lat] = coord.split(',').map(parseFloat);
      return {lat, lng};
    }).filter(c => !isNaN(c.lat) && !isNaN(c.lng));
    
    if (coords.length === 0) continue;
    
    // Calculate bounding box
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    zones.push({
      id: i + 1,
      name,
      minLat,
      maxLat,
      minLng,
      maxLng,
      centerLat,
      centerLng,
    });
  }
  
  return zones;
}

function main() {
  if (!fs.existsSync(KML_FILE)) {
    console.error(`KML file not found: ${KML_FILE}`);
    console.log('\nTo use this script:');
    console.log('1. Export KML from Google My Maps');
    console.log('   URL: https://www.google.com/maps/d/kml?mid=1IZvwLsYlspxBhN62ArLDPE9xD6zjirwg');
    console.log('2. Save it as zones.kml in the scripts directory');
    console.log('3. Run: npm run extract-zones');
    console.log('4. The output will be written to src/data/zones.json');
    process.exit(1);
  }
  
  const kmlContent = fs.readFileSync(KML_FILE, 'utf-8');
  const zones = parseKML(kmlContent);
  
  if (zones.length === 0) {
    console.error('No zones found in KML file');
    process.exit(1);
  }
  
  const output = JSON.stringify(zones, null, 2);
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  
  console.log(`Successfully extracted ${zones.length} zones`);
  console.log(`Output written to: ${OUTPUT_FILE}`);
}

main();
