/**
 * Configuration for a 3D model to be displayed on the map
 */
export interface Model3DConfig {
  /** Unique identifier for the model */
  id: string
  /** Path to the GLTF model file */
  modelPath: string
  /** Geographic coordinates [longitude, latitude] */
  coordinates: [number, number]
  /** Altitude in meters (default: 0) */
  altitude?: number
  /** Rotation in radians [x, y, z] (default: [Math.PI / 2, 0, 0]) */
  rotation?: [number, number, number]
  /** Scale factor (default: 0.3) */
  scale?: number
  /** Optional name/description for the tourist spot */
  name?: string
}

