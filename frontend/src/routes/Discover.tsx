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
import { matchPlaceToModel } from '../utils/matchPlaceToModel'
import type { PlaceInfo } from '../types/api'

interface DiscoverProps {
  isSidebarOpen?: boolean
  onPlaceSelectFromAI?: (handler: (place: PlaceInfo) => void) => void
}

export default function Discover({ isSidebarOpen = false, onPlaceSelectFromAI }: DiscoverProps) {
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
  
  // Handle place selection from AI chatbot
  const handlePlaceFromAI = useCallback((place: PlaceInfo) => {
    // Match place to model
    const modelId = matchPlaceToModel(place)
    
    if (!modelId) {
      // Place doesn't match any model, just log it
      console.log('Place from AI does not match any 3D model:', place)
      return
    }
    
    // Find the model
    const model = touristSpotModels.find(m => m.id === modelId)
    if (!model || !map) {
      return
    }
    
    // Select the model (this will show the info card)
    setSelectedTouristSpot(modelId)
    
    // Calculate marker coordinates with the same offset as markers use
    // This matches the marker click animation behavior
    const geoOffset: [number, number] = [45, 25] // metersNorth, metersEast - same as useMap3DMarkers
    const earthRadius = 6378137 // Earth's radius in meters
    const [metersNorth, metersEast] = geoOffset
    const [modelLng, modelLat] = model.coordinates
    
    // Offset latitude (north/south)
    const markerLat = modelLat + (metersNorth / earthRadius) * (180 / Math.PI)
    // Offset longitude (east/west) - adjusted for latitude
    const markerLng = modelLng + (metersEast / (earthRadius * Math.cos((modelLat * Math.PI) / 180))) * (180 / Math.PI)
    const markerCoordinates: [number, number] = [markerLng, markerLat]
    
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
    
    // Center on the marker coordinates since that's where the marker would be shown
    // This accounts for the geographic offset between marker and model
    map.flyTo({
      center: markerCoordinates,
      zoom: targetZoom,
      pitch: targetPitch,
      bearing: MAP_CONFIG.DEFAULT_BEARING,
      duration: ANIMATION_CONFIG.FLY_TO_DURATION,
      essential: true
    })
  }, [map, setSelectedTouristSpot])
  
  // Expose the handler to parent component
  useEffect(() => {
    if (onPlaceSelectFromAI) {
      onPlaceSelectFromAI(handlePlaceFromAI)
    }
  }, [onPlaceSelectFromAI, handlePlaceFromAI])
  

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
              const targetZoom = Math.max(19, ANIMATION_CONFIG.DEFAULT_ZOOM_ON_SELECT - scaleAdjustment - altitudeAdjustment)
              
              // Adjust pitch based on terrain state - lower pitch when terrain is off for better centering
              const hasTerrain = mapInstance.getTerrain() !== null
              const targetPitch = hasTerrain ? 65 : 45 // Lower pitch when terrain is off
              
              // Always center to model coordinates with fixed bearing and pitch
              mapInstance.flyTo({
                center: model.coordinates,
                zoom: targetZoom,
                pitch: targetPitch,
                bearing: MAP_CONFIG.DEFAULT_BEARING,
                duration: ANIMATION_CONFIG.FLY_TO_DURATION,
                essential: true
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

        // Load province GeoJSON and add white border outlines
        fetch('/CATANDUANES.geojson')
          .then(response => response.json())
          .then((provinceGeoJson) => {
            if (!mapInstance) return

            // Merge Caramoran and Palumbanes Island into a single feature
            // Find all Caramoran features (GEOCODE: "052004000")
            const caramoranFeatures: any[] = []
            const otherFeatures: any[] = []
            
            provinceGeoJson.features.forEach((feature: any) => {
              if (feature.properties && feature.properties.GEOCODE === '052004000') {
                caramoranFeatures.push(feature)
              } else {
                otherFeatures.push(feature)
              }
            })

            // Combine all Caramoran polygons into a MultiPolygon
            let mergedCaramoran: any = null
            if (caramoranFeatures.length > 0) {
              const polygons: number[][][] = []
              caramoranFeatures.forEach((feature: any) => {
                if (feature.geometry.type === 'Polygon') {
                  polygons.push(feature.geometry.coordinates[0])
                } else if (feature.geometry.type === 'MultiPolygon') {
                  feature.geometry.coordinates.forEach((polygon: number[][][]) => {
                    polygons.push(polygon[0])
                  })
                }
              })

              // Create merged feature with first feature's properties
              mergedCaramoran = {
                type: 'Feature',
                properties: caramoranFeatures[0].properties,
                geometry: {
                  type: 'MultiPolygon',
                  coordinates: polygons.map(poly => [poly])
                }
              }
            }

            // Create new feature collection with merged Caramoran
            const processedGeoJson: GeoJSON.FeatureCollection = {
              type: 'FeatureCollection',
              features: mergedCaramoran 
                ? [mergedCaramoran, ...otherFeatures]
                : otherFeatures
            }

            // Add the province boundaries source
            if (!mapInstance.getSource('provinceBoundaries')) {
              mapInstance.addSource('provinceBoundaries', {
                type: 'geojson',
                data: processedGeoJson
              })
            } else {
              // Update existing source
              const source = mapInstance.getSource('provinceBoundaries')
              if (source && source.type === 'geojson') {
                (source as maplibregl.GeoJSONSource).setData(processedGeoJson)
              }
            }

            // Get layer insertion point
            const layers = mapInstance.getStyle().layers
            const firstSymbolLayerId = layers?.find(layer => layer.type === 'symbol')?.id

            // Add invisible fill layer for hover detection
            if (!mapInstance.getLayer('provinceHoverLayer')) {
              mapInstance.addLayer({
                id: 'provinceHoverLayer',
                type: 'fill',
                source: 'provinceBoundaries',
                paint: {
                  'fill-color': 'transparent',
                  'fill-opacity': 0
                }
              }, firstSymbolLayerId)
            }

            // Add the province borders layer (white outlines) - invisible by default
            if (!mapInstance.getLayer('provinceBordersLayer')) {
              mapInstance.addLayer({
                id: 'provinceBordersLayer',
                type: 'line',
                source: 'provinceBoundaries',
                paint: {
                  'line-color': '#ffffff',
                  'line-width': 2,
                  'line-opacity': 0 // Invisible by default, will be shown on hover
                },
                filter: ['==', 'GEOCODE', ''] // Filter to show nothing by default
              }, firstSymbolLayerId) // Insert before first symbol layer if it exists
            }

            // Track currently hovered municipality (using GEOCODE for consistency)
            let hoveredMunicipalityGeocode: string | null = null

            // Handle mouse move to detect municipality hover
            const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
              if (!mapInstance) return

              const features = mapInstance.queryRenderedFeatures(e.point, {
                layers: ['provinceHoverLayer']
              })

              // Get the first feature (municipality) under the cursor
              const hoveredFeature = features[0]
              
              if (hoveredFeature && hoveredFeature.properties) {
                // Use GEOCODE for filtering (more reliable for merged features)
                const municipalityGeocode = hoveredFeature.properties.GEOCODE || hoveredFeature.properties.OBJECTID?.toString()
                
                // Only update if hovering a different municipality
                if (hoveredMunicipalityGeocode !== municipalityGeocode) {
                  hoveredMunicipalityGeocode = municipalityGeocode
                  
                  // Update filter to show only the hovered municipality
                  // Use GEOCODE if available, otherwise fall back to OBJECTID
                  if (hoveredFeature.properties.GEOCODE) {
                    mapInstance.setFilter('provinceBordersLayer', ['==', 'GEOCODE', municipalityGeocode])
                  } else {
                    mapInstance.setFilter('provinceBordersLayer', ['==', 'OBJECTID', hoveredFeature.properties.OBJECTID])
                  }
                  mapInstance.setPaintProperty('provinceBordersLayer', 'line-opacity', 1)
                  
                  // Change cursor to pointer
                  mapInstance.getCanvas().style.cursor = 'pointer'
                }
              } else {
                // No municipality under cursor
                if (hoveredMunicipalityGeocode !== null) {
                  hoveredMunicipalityGeocode = null
                  
                  // Hide borders
                  mapInstance.setFilter('provinceBordersLayer', ['==', 'GEOCODE', ''])
                  mapInstance.setPaintProperty('provinceBordersLayer', 'line-opacity', 0)
                  
                  // Reset cursor
                  mapInstance.getCanvas().style.cursor = ''
                }
              }
            }

            // Handle mouse leave to hide borders
            const handleMouseLeave = () => {
              if (!mapInstance) return
              
              hoveredMunicipalityGeocode = null
              mapInstance.setFilter('provinceBordersLayer', ['==', 'GEOCODE', ''])
              mapInstance.setPaintProperty('provinceBordersLayer', 'line-opacity', 0)
              mapInstance.getCanvas().style.cursor = ''
            }

            // Add event listeners
            mapInstance.on('mousemove', 'provinceHoverLayer', handleMouseMove)
            mapInstance.on('mouseleave', 'provinceHoverLayer', handleMouseLeave)
          })
          .catch((error) => {
            console.warn('Failed to load province boundaries:', error)
          })

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
        // Remove hover event listeners if layers exist
        try {
          if (mapInstance.getLayer('provinceHoverLayer')) {
            // Remove all event listeners for this layer by removing and re-adding would be complex
            // Instead, we'll just let map.remove() handle cleanup
          }
        } catch (e) {
          // Layers might not exist, ignore
        }
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

