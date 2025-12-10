/**
 * Environment variable validation and access
 * @deprecated Use envValidation.ts for validated access
 */

import { getValidatedMapTilerKey as getValidatedKey, getValidatedApiUrl as getValidatedUrl } from './envValidation'

/**
 * Get MapTiler API key from environment variables
 * Falls back to a default key if not set (for development only)
 * In production, always set VITE_MAPTILER_KEY in your .env file
 * 
 * @deprecated Use getValidatedMapTilerKey() from envValidation.ts
 */
export function getMapTilerKey(): string {
  try {
    return getValidatedKey()
  } catch {
    // Fallback for backward compatibility
    const key = import.meta.env.VITE_MAPTILER_KEY
    if (!key) {
      // Fallback to the existing key for backward compatibility
      return 'wmOESkw5rZIYiq12dSvF'
    }
    return key
  }
}

/**
 * Get API URL from environment variables
 * @deprecated Use getValidatedApiUrl() from envValidation.ts
 */
export function getApiUrl(): string {
  try {
    return getValidatedUrl()
  } catch {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  }
}

