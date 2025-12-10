/**
 * Type definitions for API requests and responses
 */

/** Geographic coordinates [longitude, latitude] */
export type Coordinates = [number, number]

/** Route option request */
export interface RouteRequest {
  from: Coordinates
  to: Coordinates
}

/** Route option from backend */
export interface RouteOption {
  id: string
  eta_mins: number
}

/** Route options response from backend */
export interface RouteOptionsResponse {
  options: RouteOption[]
}

/** Legacy route option (for future use with actual routing service) */
export interface RouteOptionDetailed {
  distance: number
  duration: number
  polyline: string
  mode: 'walking' | 'driving' | 'cycling'
}

/** Legacy route response (for future use) */
export interface RouteResponse {
  routes: RouteOptionDetailed[]
}

/** AI Chat request */
export interface ChatRequest {
  prompt: string
}

/** Place information with coordinates */
export interface PlaceInfo {
  name: string
  lat: number
  lng: number
  type: string
}

/** AI Chat response with places */
export interface ChatResponse {
  reply: string
  places: PlaceInfo[]
}

/** All places response */
export interface AllPlacesResponse {
  places: PlaceInfo[]
}

/** Chat message for UI */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  places?: PlaceInfo[]
  timestamp: Date
}
