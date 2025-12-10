/**
 * Environment variable validation using Zod
 * Validates all required environment variables on app startup
 */
import { z } from 'zod'

/**
 * Schema for environment variables
 */
const envSchema = z.object({
  VITE_MAPTILER_KEY: z.string().min(1, 'MapTiler API key is required'),
  VITE_API_URL: z.string().url('API URL must be a valid URL').default('http://localhost:8000/api'),
})

type Env = z.infer<typeof envSchema>

/**
 * Validated environment variables
 * Throws error if validation fails
 */
let validatedEnv: Env | null = null

/**
 * Validate and return environment variables
 * @throws {Error} If validation fails
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse({
      VITE_MAPTILER_KEY: import.meta.env.VITE_MAPTILER_KEY,
      VITE_API_URL: import.meta.env.VITE_API_URL,
    })
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n')
      throw new Error(`Environment variable validation failed:\n${errors}`)
    }
    throw error
  }
}

/**
 * Get validated MapTiler API key
 */
export function getValidatedMapTilerKey(): string {
  try {
    const env = validateEnv()
    return env.VITE_MAPTILER_KEY || 'wmOESkw5rZIYiq12dSvF' // Fallback for development
  } catch {
    // Fallback for backward compatibility
    return import.meta.env.VITE_MAPTILER_KEY || 'wmOESkw5rZIYiq12dSvF'
  }
}

/**
 * Get validated API URL
 */
export function getValidatedApiUrl(): string {
  const env = validateEnv()
  return env.VITE_API_URL
}

