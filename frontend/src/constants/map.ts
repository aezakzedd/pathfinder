/**
 * Map configuration constants
 * Centralized configuration values for map initialization and behavior
 */
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 9.5, // Zoomed out to show entire island of Catanduanes
  DEFAULT_CENTER: [124.25, 13.75] as [number, number], // Center of Catanduanes island
  DEFAULT_PITCH: 60,
  DEFAULT_BEARING: 0,
  MIN_ZOOM: 10,
  MAX_ZOOM: 22,
  MODEL_CLICK_THRESHOLD: 0.001, // degrees (roughly 100m)
  TERRAIN_EXAGGERATION: 1,
  TERRAIN_LOAD_DELAY: 1000, // milliseconds
} as const

/**
 * Model loading configuration
 */
export const MODEL_CONFIG = {
  DEFAULT_SCALE: 0.3,
  DEFAULT_ROTATION: [Math.PI / 2, 0, 0] as [number, number, number],
  DEFAULT_ALTITUDE: 0,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // milliseconds (base delay, exponential backoff)
} as const

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  FLY_TO_DURATION: 2000, // milliseconds
  ORBIT_DURATION: 0, // 0 = infinite
  DEFAULT_ZOOM_ON_SELECT: 19,
} as const

/**
 * UI configuration
 */
export const UI_CONFIG = {
  TOAST_DURATION_SUCCESS: 2000,
  TOAST_DURATION_ERROR: 5000,
  LOADING_TIMEOUT: 10000, // milliseconds
} as const

