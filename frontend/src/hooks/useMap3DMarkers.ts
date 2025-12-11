import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { Model3DConfig } from '../types/model'
import { ANIMATION_CONFIG, MODEL_CONFIG, MAP_CONFIG } from '../constants/map'

/**
 * Offset coordinates by meters (north/south and east/west)
 * @param lng - Longitude
 * @param lat - Latitude
 * @param metersNorth - Meters to offset north (positive) or south (negative)
 * @param metersEast - Meters to offset east (positive) or west (negative)
 * @returns New [lng, lat] coordinates
 */
function offsetCoordinates(
  lng: number,
  lat: number,
  metersNorth: number = 0,
  metersEast: number = 0
): [number, number] {
  // Earth's radius in meters
  const earthRadius = 6378137

  // Offset latitude (north/south)
  const newLat = lat + (metersNorth / earthRadius) * (180 / Math.PI)

  // Offset longitude (east/west) - adjusted for latitude
  const newLng = lng + (metersEast / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI)

  return [newLng, newLat]
}

/**
 * Hook to manage circular gradient markers for 3D models on a MapLibre map
 * 
 * Features:
 * - Automatic marker creation for all models
 * - Hover effects
 * - Click handlers to select tourist spots
 * - Configurable marker styling with geographic offset
 * - Markers have independent geographic coordinates
 * - Vertical pixel offset for hovering effect
 * - Automatic cleanup
 * 
 * @param map - MapLibre map instance (null if not initialized)
 * @param models - Array of 3D model configurations to create markers for
 * @param onMarkerClick - Callback function when marker is clicked
 * @param geoOffset - Optional [metersNorth, metersEast] geographic offset in meters
 * @param verticalOffset - Optional vertical pixel offset (negative = up, positive = down)
 */
export function useMap3DMarkers(
  map: maplibregl.Map | null,
  models: Model3DConfig[],
  onMarkerClick: (modelId: string) => void,
  geoOffset: [number, number] = [0, 0], // Default: no geographic offset
  verticalOffset: number = -100 // Default: 100 pixels up
) {
  const markersRef = useRef<maplibregl.Marker[]>([])

  // Create marker element with gradient styling, image overlay, and label
  const createMarkerElement = useCallback((label: string) => {
    // Create main container for marker (this gets positioned by MapLibre)
    const container = document.createElement('div')
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      position: relative;
    `
    
    // Create circle container
    const circleContainer = document.createElement('div')
    circleContainer.style.cssText = `
      width: 40px;
      height: 40px;
      position: relative;
    `
    
    // Create inner circle with gradient styling
    const circle = document.createElement('div')
    circle.className = 'model-marker-circle'
    circle.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at center,rgb(20, 38, 202) 0%,rgb(38, 51, 172) 30%, #93c5fd 60%, white 100%);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease;
      transform-origin: center center;
      position: relative;
      overflow: hidden;
    `
    
    // Create image overlay
    const image = document.createElement('img')
    image.src = '/Marker/bote_light.png'
    image.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 125%;
      height: 125%;
      object-fit: contain;
      pointer-events: none;
    `
    
    circle.appendChild(image)
    circleContainer.appendChild(circle)
    
    // Create label element
    const labelElement = document.createElement('div')
    labelElement.textContent = label
    labelElement.style.cssText = `
      margin-top: 4px;
      padding: 4px 8px;
      background: transparent;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      color: white;
      white-space: nowrap;
      text-shadow: 
        -1px -1px 0 #000,
        1px -1px 0 #000,
        -1px 1px 0 #000,
        1px 1px 0 #000,
        0 0 3px rgba(0, 0, 0, 0.8);
      pointer-events: none;
    `
    
    container.appendChild(circleContainer)
    container.appendChild(labelElement)
    
    // Add hover effect to circle only (image will scale with it)
    container.addEventListener('mouseenter', () => {
      circle.style.transform = 'scale(1.15)'
    })
    container.addEventListener('mouseleave', () => {
      circle.style.transform = 'scale(1)'
    })

    return container
  }, [])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Create markers for each tourist spot
    models.forEach((model) => {
      const container = createMarkerElement(model.name || model.id)

      // Calculate independent geographic coordinates for the marker
      // Offset from the model's position by the specified meters
      // Calculate this BEFORE setting up click handler so we can use it for camera centering
      const [metersNorth, metersEast] = geoOffset
      const markerCoordinates = offsetCoordinates(
        model.coordinates[0],
        model.coordinates[1],
        metersNorth,
        metersEast
      )

      // Add click handler
      container.addEventListener('click', (e) => {
        // Stop event propagation to prevent map click handler from interfering
        e.stopPropagation()
        
        onMarkerClick(model.id)
        // Fly to model with proper camera angle to see the 3D model
        // Adjust zoom based on model scale and altitude for optimal visibility
        // Larger scale/altitude = lower zoom to fit the model in view
        const modelScale = model.scale ?? MODEL_CONFIG.DEFAULT_SCALE
        const modelAltitude = model.altitude ?? MODEL_CONFIG.DEFAULT_ALTITUDE
        const scaleAdjustment = modelScale > 2 ? 1.0 : 0.5
        const altitudeAdjustment = modelAltitude > 20 ? 0.3 : 0
        const targetZoom = Math.max(19, ANIMATION_CONFIG.DEFAULT_ZOOM_ON_SELECT - scaleAdjustment - altitudeAdjustment)
        
        // Adjust pitch based on terrain state - lower pitch when terrain is off for better centering
        const hasTerrain = map.getTerrain() !== null
        const targetPitch = hasTerrain ? 65 : 45 // Lower pitch when terrain is off
        
        // Center on the marker coordinates since that's what the user clicked on
        // This accounts for the geographic offset between marker and model
        // Stop any existing animations first to ensure this one executes
        map.stop()
        map.flyTo({
          center: markerCoordinates,
          zoom: targetZoom,
          pitch: targetPitch,
          bearing: MAP_CONFIG.DEFAULT_BEARING, // Always use fixed bearing for consistent camera position
          duration: 1500,
          essential: true // Animation is essential, don't skip if low performance
        })
        
        // After animation completes, verify and correct center if needed (especially when terrain is off)
        map.once('moveend', () => {
          const currentCenter = map.getCenter()
          const expectedLng = markerCoordinates[0]
          const expectedLat = markerCoordinates[1]
          const lngDiff = Math.abs(currentCenter.lng - expectedLng)
          const latDiff = Math.abs(currentCenter.lat - expectedLat)
          
          // If center is off by more than a small threshold, correct it
          if (lngDiff > 0.0001 || latDiff > 0.0001) {
            map.jumpTo({
              center: markerCoordinates,
              zoom: targetZoom,
              pitch: targetPitch,
              bearing: MAP_CONFIG.DEFAULT_BEARING
            })
          }
        })
      })

      // Create and add marker to map with independent coordinates
      // pitchAlignment: 'viewport' (default) makes marker face camera
      // rotationAlignment: 'viewport' keeps marker upright
      const marker = new maplibregl.Marker({
        element: container,
        anchor: 'center',
        offset: [0, verticalOffset], // Vertical pixel offset for hovering effect
        pitchAlignment: 'viewport', // Marker faces camera (stands up)
        rotationAlignment: 'viewport' // Keeps marker upright
      })
        .setLngLat(markerCoordinates)
        .addTo(map)

      markersRef.current.push(marker)
    })

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [map, models, onMarkerClick, geoOffset, verticalOffset, createMarkerElement])
}