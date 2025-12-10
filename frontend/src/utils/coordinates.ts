/**
 * Coordinate validation and manipulation utilities
 */

/**
 * Validates if coordinates are within valid ranges
 * @param lng - Longitude (-180 to 180)
 * @param lat - Latitude (-90 to 90)
 * @returns True if coordinates are valid
 */
export function isValidCoordinate(lng: number, lat: number): boolean {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  )
}

/**
 * Validates a coordinate pair [longitude, latitude]
 * @param coords - Coordinate pair
 * @returns True if coordinates are valid
 */
export function isValidCoordinatePair(
  coords: [number, number] | number[]
): coords is [number, number] {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    isValidCoordinate(coords[0], coords[1])
  )
}

/**
 * Calculates the distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate [lng, lat]
 * @param coord2 - Second coordinate [lng, lat]
 * @returns Distance in meters
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1
  const [lng2, lat2] = coord2

  if (!isValidCoordinate(lng1, lat1) || !isValidCoordinate(lng2, lat2)) {
    return Infinity
  }

  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculates simple Euclidean distance in degrees (for quick comparisons)
 * @param coord1 - First coordinate [lng, lat]
 * @param coord2 - Second coordinate [lng, lat]
 * @returns Distance in degrees (approximate)
 */
export function calculateDistanceDegrees(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1
  const [lng2, lat2] = coord2
  return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2))
}

/**
 * Formats coordinates for display
 * @param coord - Coordinate [lng, lat]
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted string
 */
export function formatCoordinate(
  coord: [number, number],
  precision: number = 6
): string {
  const [lng, lat] = coord
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

/**
 * Formats distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (meters or kilometers)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(2)}km`
}

