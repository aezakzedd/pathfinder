import { PlaceInfo } from '../types/api'
import { Model3DConfig } from '../types/model'
import { touristSpotModels } from '../config/touristSpots'
import { calculateDistanceDegrees } from './coordinates'

/**
 * Match an AI place to a 3D model
 * Returns the model ID if a match is found, otherwise null
 * 
 * Matches by:
 * 1. Name similarity (case-insensitive, partial match)
 * 2. Coordinate proximity (within ~100m)
 */
export function matchPlaceToModel(place: PlaceInfo): string | null {
  const placeName = place.name.toLowerCase().trim()
  const placeCoords: [number, number] = [place.lng, place.lat]
  
  // Check each model for a match
  for (const model of touristSpotModels) {
    const modelName = (model.name || model.id).toLowerCase().trim()
    
    // 1. Check name match (case-insensitive, allow partial match)
    if (
      modelName === placeName ||
      modelName.includes(placeName) ||
      placeName.includes(modelName)
    ) {
      return model.id
    }
    
    // 2. Check coordinate proximity (within ~100m or ~0.001 degrees)
    const distance = calculateDistanceDegrees(
      placeCoords,
      model.coordinates
    )
    
    // Roughly 100m threshold (0.001 degrees is approximately 111m)
    if (distance < 0.001) {
      return model.id
    }
  }
  
  return null
}

/**
 * Get model configuration by ID
 */
export function getModelById(modelId: string): Model3DConfig | null {
  return touristSpotModels.find(m => m.id === modelId) || null
}

