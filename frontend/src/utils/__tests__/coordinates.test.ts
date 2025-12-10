/**
 * Unit tests for coordinate utilities
 */
import { describe, it, expect } from 'vitest'
import {
  isValidCoordinate,
  isValidCoordinatePair,
  calculateDistance,
  formatCoordinate,
  formatDistance
} from '../coordinates'

describe('isValidCoordinate', () => {
  it('should return true for valid coordinates', () => {
    expect(isValidCoordinate(0, 0)).toBe(true)
    expect(isValidCoordinate(124.5, 13.7)).toBe(true)
    expect(isValidCoordinate(-180, -90)).toBe(true)
    expect(isValidCoordinate(180, 90)).toBe(true)
  })

  it('should return false for invalid coordinates', () => {
    expect(isValidCoordinate(181, 0)).toBe(false)
    expect(isValidCoordinate(0, 91)).toBe(false)
    expect(isValidCoordinate(NaN, 0)).toBe(false)
    expect(isValidCoordinate(0, NaN)).toBe(false)
  })
})

describe('calculateDistance', () => {
  it('should calculate distance between two points', () => {
    const coord1: [number, number] = [124.393269, 13.689568]
    const coord2: [number, number] = [124.394875, 13.690098]
    const distance = calculateDistance(coord1, coord2)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(1000) // Should be less than 1km
  })
})

describe('formatCoordinate', () => {
  it('should format coordinates correctly', () => {
    const coord: [number, number] = [124.393269, 13.689568]
    const formatted = formatCoordinate(coord, 6)
    expect(formatted).toBe('13.689568, 124.393269')
  })
})

describe('formatDistance', () => {
  it('should format meters correctly', () => {
    expect(formatDistance(500)).toBe('500m')
    expect(formatDistance(1500)).toBe('1.50km')
  })
})

