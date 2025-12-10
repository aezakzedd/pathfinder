import maplibregl from 'maplibre-gl'

/**
 * Geographic bounds for Catanduanes Province, Philippines
 * Coordinates are in [longitude, latitude] format
 */
export const CATANDUANES_BOUNDS: [[number, number], [number, number]] = [
  [123.8, 13.4],  // Southwest corner [minLng, minLat]
  [124.7, 14.1]   // Northeast corner [maxLng, maxLat]
]

/**
 * Checks if a point (lng, lat) is within Catanduanes bounds
 */
export function isPointInCatanduanes(lng: number, lat: number): boolean {
  const [[minLng, minLat], [maxLng, maxLat]] = CATANDUANES_BOUNDS
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}

/**
 * Checks if the map viewport intersects with Catanduanes bounds
 * Returns true if any part of the visible map area overlaps with Catanduanes
 */
export function isViewportInCatanduanes(map: maplibregl.Map): boolean {
  const bounds = map.getBounds()
  const [[minLng, minLat], [maxLng, maxLat]] = CATANDUANES_BOUNDS
  
  // Check if viewport bounds overlap with Catanduanes bounds
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  
  // Check for intersection
  return !(
    ne.lng < minLng ||  // Viewport is to the west of Catanduanes
    sw.lng > maxLng ||  // Viewport is to the east of Catanduanes
    ne.lat < minLat ||  // Viewport is to the south of Catanduanes
    sw.lat > maxLat     // Viewport is to the north of Catanduanes
  )
}

