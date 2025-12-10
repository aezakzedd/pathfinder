import axios, { AxiosError } from 'axios'
import type { Coordinates, RouteRequest, RouteOptionsResponse, ChatRequest, ChatResponse } from '../types/api'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 15000
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
 * Chat with AI endpoint - proxies to server-side AI.
 * Frontend should never include AI keys.
 */
export async function chatWithAi(prompt: string): Promise<ChatResponse> {
  try {
    const request: ChatRequest = { prompt }
    const response = await API.post<ChatResponse>('/chat', request)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to chat with AI: ${error.message}`)
    }
    throw error
  }
}

export default API

