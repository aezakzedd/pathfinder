import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMap3DModels } from '../hooks/useMap3DModels'
import { useMap3DMarkers } from '../hooks/useMap3DMarkers'
import { touristSpotModels } from '../config/touristSpots'
import { isViewportInCatanduanes } from '../utils/catanduanesBounds'
import { getMapTilerKey } from '../utils/env'
import { useStore } from '../state/store'
import TouristSpotInfo from '../components/TouristSpotInfo'
import { MAP_CONFIG, MODEL_CONFIG, ANIMATION_CONFIG, UI_CONFIG } from '../constants/map'
import { calculateDistanceDegrees } from '../utils/coordinates'
import PerformanceModeToggle from '../components/PerformanceModeToggle'
import toast from 'react-hot-toast'

interface DiscoverProps {
  isSidebarOpen?: boolean
}

export default function Discover({ isSidebarOpen = false }: DiscoverProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [map, setMap] = useState<maplibregl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Store state
  const {
    selectedTouristSpot,
    setSelectedTouristSpot,
    setMapViewport,
    setLoadingState,
    setError: setStoreError,
    terrainEnabled,
    modelsEnabled
  } = useStore()
  
  // Get selected spot data
  const selectedSpot = useMemo(() => {
    return touristSpotModels.find(m => m.id === selectedTouristSpot) || null
  }, [selectedTouristSpot])
  
  // Handle closing tourist spot info
  const handleCloseSpotInfo = useCallback(() => {
    setSelectedTouristSpot(null)
  }, [setSelectedTouristSpot])
  

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    let mapInstance: maplibregl.Map | null = null
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null

    try {
      // Get MapTiler API key from environment variables
      const apiKey = getMapTilerKey()

      mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        center: MAP_CONFIG.DEFAULT_CENTER,
        pitch: MAP_CONFIG.DEFAULT_PITCH,
        bearing: MAP_CONFIG.DEFAULT_BEARING,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        canvasContextAttributes: { antialias: true }
      })
      
      // Add map controls
      mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Handle map errors
      mapInstance.on('error', (e) => {
        const errorMessage = `Map error: ${e.error?.message || 'Unknown error'}`
        // Use proper error handling instead of console.error
        setError(errorMessage)
        setStoreError('map', errorMessage)
        setLoadingState('map', false)
        toast.error('Failed to load map')
        setIsLoading(false)
        if (loadingTimeout) {
          clearTimeout(loadingTimeout)
          loadingTimeout = null
        }
      })

      // Handle successful load - ensure loading state is cleared
      mapInstance.once('load', () => {
        setIsLoading(false)
        setError(null)
        setLoadingState('map', false)
        if (loadingTimeout) {
          clearTimeout(loadingTimeout)
          loadingTimeout = null
        }
      })
      
      // Update viewport state on map movement
      const updateViewport = () => {
        if (!mapInstance) return
        setMapViewport({
          center: mapInstance.getCenter().toArray() as [number, number],
          zoom: mapInstance.getZoom(),
          pitch: mapInstance.getPitch(),
          bearing: mapInstance.getBearing()
        })
      }
      
      if (mapInstance) {
        mapInstance.on('moveend', updateViewport)
        mapInstance.on('zoomend', updateViewport)
        
        // Handle map clicks for model interaction
        mapInstance.on('click', (e) => {
          // Don't handle clicks on controls or UI elements
          const target = e.originalEvent?.target as HTMLElement
          if (target?.closest('.maplibregl-ctrl') || 
              target?.closest('.maplibregl-control-container') ||
              target?.closest('[style*="z-index: 1000"]') ||
              target?.closest('[class*="z-[1000]"]')) {
            return
          }
          
          // Check if click is near any model coordinates
          const clickedLng = e.lngLat.lng
          const clickedLat = e.lngLat.lat
          
          // Find nearest model within reasonable distance (rough check)
          for (const model of touristSpotModels) {
            const distance = calculateDistanceDegrees(
              [clickedLng, clickedLat],
              model.coordinates
            )
            // If click is within threshold distance, consider it a hit
            if (distance < MAP_CONFIG.MODEL_CLICK_THRESHOLD && mapInstance) {
              setSelectedTouristSpot(model.id)
              // Fly to the model location with proper camera angle to see the 3D model
              // Adjust zoom based on model scale and altitude for optimal visibility
              const modelScale = model.scale ?? MODEL_CONFIG.DEFAULT_SCALE
              const modelAltitude = model.altitude ?? MODEL_CONFIG.DEFAULT_ALTITUDE
              const scaleAdjustment = modelScale > 2 ? 1.0 : 0.5
              const altitudeAdjustment = modelAltitude > 20 ? 0.3 : 0
              const targetZoom = Math.max(17.5, ANIMATION_CONFIG.DEFAULT_ZOOM_ON_SELECT - scaleAdjustment - altitudeAdjustment)
              mapInstance.flyTo({
                center: model.coordinates,
                zoom: targetZoom,
                pitch: 65, // Tilted view to see 3D model better
                bearing: mapInstance.getBearing(), // Keep current bearing
                duration: 1500,
                essential: true // Animation is essential, don't skip if low performance
              })
              break
            }
          }
        })
      }

      // Fallback: clear loading state after a timeout if load event doesn't fire
      loadingTimeout = setTimeout(() => {
        // Silently clear loading state if timeout occurs
        setIsLoading(false)
        loadingTimeout = null
      }, UI_CONFIG.LOADING_TIMEOUT)

      // Add terrain sources and configuration after style loads
      mapInstance.once('style.load', () => {
        if (!mapInstance) return
        
        // Add terrain source using MapTiler's terrain tiles
        if (!mapInstance.getSource('terrainSource')) {
          mapInstance.addSource('terrainSource', {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${apiKey}`,
            tileSize: 256,
            maxzoom: 14
          })
        }

        // Enable terrain immediately if terrainEnabled is true and viewport is in Catanduanes
        // This ensures terrain appears on initial load
        if (terrainEnabled && isViewportInCatanduanes(mapInstance)) {
          try {
            mapInstance.setTerrain({
              source: 'terrainSource',
              exaggeration: MAP_CONFIG.TERRAIN_EXAGGERATION
            })
          } catch (error) {
            // Terrain source might not be ready yet, will be handled by useEffect
          }
        }
      })

      mapRef.current = mapInstance
      setMap(mapInstance)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map'
      // Use proper error handling instead of console.error
      setError(errorMessage)
      setStoreError('map', errorMessage)
      toast.error(errorMessage)
      setIsLoading(false)
    }

    // Handle window resize
    const handleResize = () => {
      if (mapInstance) {
        mapInstance.resize()
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
        loadingTimeout = null
      }
      if (mapInstance) {
        mapInstance.remove()
        mapRef.current = null
        setMap(null)
      }
    }
  }, [])

  // Update terrain when terrainEnabled changes or map moves
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return
    
    const updateTerrainState = () => {
      if (!map) return
      
      // Check if terrain source exists
      if (!map.getSource('terrainSource')) {
        // Wait for terrain source to be added
        return
      }
      
      const hasTerrain = map.getTerrain() !== null
      const inCatanduanes = isViewportInCatanduanes(map)

      if (terrainEnabled && inCatanduanes && !hasTerrain) {
        // Enable terrain when terrainEnabled is true and viewport is in Catanduanes
        try {
          map.setTerrain({
            source: 'terrainSource',
            exaggeration: MAP_CONFIG.TERRAIN_EXAGGERATION
          })
        } catch (error) {
          // Terrain source might not be ready yet, ignore
        }
      } else if ((!terrainEnabled || !inCatanduanes) && hasTerrain) {
        // Disable terrain when terrainEnabled is false or viewport is outside Catanduanes
        map.setTerrain(null)
      }
    }

    // Update immediately
    updateTerrainState()

    // Also update on map movement and when data loads (terrain source might load later)
    map.on('moveend', updateTerrainState)
    map.on('zoomend', updateTerrainState)
    map.on('data', updateTerrainState) // Trigger when new data (like terrain source) loads

    return () => {
      map.off('moveend', updateTerrainState)
      map.off('zoomend', updateTerrainState)
      map.off('data', updateTerrainState)
    }
  }, [map, terrainEnabled])

  // Add all 3D models to the map using the reusable hook (only if models are enabled)
  useMap3DModels(modelsEnabled ? map : null, touristSpotModels)

  // Add circular markers with gradient at independent geographic coordinates
  // Parameters: (map, models, onClick, [metersNorth, metersEast], verticalPixelOffset)
  // Using 0 vertical offset so marker position is independent of camera zoom/angle
  useMap3DMarkers(map, touristSpotModels, setSelectedTouristSpot, [45, 25], 0)

  // Resize map when container size changes (e.g., when sidebar toggles)
  useEffect(() => {
    if (!map || !mapContainer.current) return

    const resizeObserver = new ResizeObserver(() => {
      // Use setTimeout to ensure the DOM has fully updated
      setTimeout(() => {
        if (map) {
          map.resize()
        }
      }, 100)
    })

    resizeObserver.observe(mapContainer.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [map])

  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
      {/* Map container - always rendered so useEffect can access it */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90" style={{ zIndex: 1, pointerEvents: 'auto' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90" style={{ zIndex: 1, pointerEvents: 'auto' }}>
          <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Map</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      {/* Tourist Spot Info Panel */}
      <TouristSpotInfo spot={selectedSpot} onClose={handleCloseSpotInfo} />
      
      {/* Performance Mode Toggle - Controls terrain and models */}
      <PerformanceModeToggle isSidebarOpen={isSidebarOpen} />
    </div>
  )
}

