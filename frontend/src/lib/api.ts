import axios from 'axios'
import type { Coordinates, RouteOptionsResponse, ChatRequest, ChatResponse, AllPlacesResponse } from '../types/api'

/**
 * Get the API base URL, auto-detecting from current hostname for network access
 */
function getApiBaseUrl(): string {
  // Use explicit env variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Auto-detect from current hostname (works for localhost and network access)
  const hostname = window.location.hostname
  
  // Always use HTTP for backend (backend doesn't use HTTPS in dev)
  // If accessing via localhost/127.0.0.1, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }
  
  // Otherwise use HTTP with the same hostname (for network access)
  // Note: Always use HTTP for backend, not the frontend's protocol
  return `http://${hostname}:8000/api`
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000 // 2 minute timeout for AI responses (first run downloads models)
})

export async function fetchRouteOptions(
  from: Coordinates,
  to: Coordinates
): Promise<RouteOptionsResponse> {
  try {
    // Convert coordinates to backend format
    const request = {
      from: { lng: from[0], lat: from[1] },
      to: { lng: to[0], lat: to[1] }
    }
    const response = await API.post<RouteOptionsResponse>('/route-options', request)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      throw new Error(`Failed to fetch route options: ${error.message}`)
    }
    throw error
  }
}

/**
 * Chat with Pathfinder AI assistant.
 * Returns a response with optional place recommendations.
 */
export async function chatWithAi(prompt: string): Promise<ChatResponse> {
  try {
    const request: ChatRequest = { prompt }
    console.log('Sending chat request to:', API.defaults.baseURL + '/chat')
    console.log('Request payload:', request)
    const response = await API.post<ChatResponse>('/chat', request)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Chat API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        code: error.code
      })
      
      // Network errors (can't reach server)
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          throw new Error('Cannot connect to the server. Please check if the backend is running and accessible.')
        }
        if (error.message.includes('timeout')) {
          throw new Error('Request timed out. The server may be processing your request - please try again.')
        }
        throw new Error(`Network error: ${error.message}. Please check your connection.`)
      }
      
      // HTTP errors (server responded)
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before asking again.')
      }
      if (error.response?.status === 400 || error.response?.status === 422) {
        const detail = error.response?.data?.detail || error.response?.data?.message || 'Invalid request'
        throw new Error(`Bad request: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
      }
      if (error.response?.status === 500) {
        // Server error - but the backend should still work offline
        const detail = error.response?.data?.detail || 'Server error'
        throw new Error(`Server error: ${detail}. The AI may be initializing - please try again.`)
      }
      throw new Error(`Failed to chat with AI: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get all available tourist places.
 */
export async function fetchAllPlaces(): Promise<AllPlacesResponse> {
  try {
    const response = await API.get<AllPlacesResponse>('/places')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch places: ${error.message}`)
    }
    throw error
  }
}

export default API
