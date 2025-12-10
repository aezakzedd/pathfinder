import { useEffect, useRef, useMemo, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { Model3DConfig } from '../types/model'
import { createModel3DLayer } from '../utils/createModelLayer'
import { useStore } from '../state/store'
import { MAP_CONFIG, UI_CONFIG } from '../constants/map'
import toast from 'react-hot-toast'

/**
 * Hook to manage multiple 3D models on a MapLibre map
 * Lightweight and efficient - adds all models to the map
 * 
 * Features:
 * - Automatic model loading when map is ready
 * - Visibility toggle support
 * - Loading state management
 * - Error handling with retry logic
 * - Progress tracking
 * - Model caching (handled in createModelLayer)
 * 
 * @param map - MapLibre map instance (null if not initialized)
 * @param models - Array of 3D model configurations to add to the map
 */

export function useMap3DModels(
  map: maplibregl.Map | null,
  models: Model3DConfig[]
) {
  const layersAdded = useRef<Set<string>>(new Set())
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { setLoadingState, setError: setStoreError, modelVisibility } = useStore()
  
  // Memoize models array to prevent unnecessary re-renders
  const memoizedModels = useMemo(() => models, [models])

  // Listen for model load errors
  const handleModelError = useCallback((event: Event) => {
    const customEvent = event as CustomEvent
    const { modelId, error: errorMessage } = customEvent.detail
    const modelConfig = memoizedModels.find(m => m.id === modelId)
    setLoadingState(`model-${modelId}`, false)
    setStoreError(`model-${modelId}`, errorMessage)
    toast.error(
      `Failed to load ${modelConfig?.name || modelId}: ${errorMessage}`,
      { duration: UI_CONFIG.TOAST_DURATION_ERROR }
    )
  }, [memoizedModels, setLoadingState, setStoreError])

  // Listen for successful model loads
  const handleModelLoad = useCallback((event: Event) => {
    const customEvent = event as CustomEvent
    if (customEvent.detail?.success) {
      const { modelId } = customEvent.detail
      const modelConfig = memoizedModels.find(m => m.id === modelId)
      setLoadingState(`model-${modelId}`, false)
      if (modelConfig?.name) {
        toast.success(`${modelConfig.name} loaded successfully`, { duration: UI_CONFIG.TOAST_DURATION_SUCCESS })
      }
    }
  }, [memoizedModels, setLoadingState])
  
  // Listen for model load progress
  const handleModelProgress = useCallback((event: Event) => {
    const customEvent = event as CustomEvent
    const { modelId, progress } = customEvent.detail
    setLoadingState(`model-${modelId}`, true)
    // Progress could be used for progress bars in the future
  }, [setLoadingState])

  useEffect(() => {
    mapRef.current = map
    if (!map) return

    // Wait for map to be fully loaded and terrain to be ready
    const addModels = () => {
      if (!mapRef.current) return
      
      // Wait a bit for terrain tiles to load if terrain is enabled
      const terrainEnabled = mapRef.current.getTerrain() !== null
      const delay = terrainEnabled ? MAP_CONFIG.TERRAIN_LOAD_DELAY : 0
      
      setTimeout(() => {
        if (!mapRef.current) return
        
        // Store reference to avoid repeated null checks
        const currentMap = mapRef.current
        
        memoizedModels.forEach((modelConfig) => {
          // Check visibility state (default to visible if not set)
          const isVisible = modelVisibility[modelConfig.id] !== false
          
          // Skip if layer already added
          if (layersAdded.current.has(modelConfig.id)) {
            // Update visibility of existing layer
            if (currentMap.getLayer(modelConfig.id)) {
              const layer = currentMap.getLayer(modelConfig.id)
              if (layer) {
                currentMap.setLayoutProperty(modelConfig.id, 'visibility', isVisible ? 'visible' : 'none')
              }
            }
            return
          }

          // Skip adding if model is hidden
          if (!isVisible) {
            return
          }

          try {
            // Check if layer already exists
            if (currentMap.getLayer(modelConfig.id)) {
              layersAdded.current.add(modelConfig.id)
              return
            }

            setLoadingState(`model-${modelConfig.id}`, true)
            
            // Create and add the model layer
            const layer = createModel3DLayer(modelConfig)
            currentMap.addLayer(layer)
            layersAdded.current.add(modelConfig.id)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            // Use proper error handling instead of console.error
            setStoreError(`model-${modelConfig.id}`, errorMessage)
            toast.error(`Failed to load model: ${modelConfig.name || modelConfig.id}`)
          }
        })
      }, delay)
    }

    // Also re-add models when terrain gets enabled (in case it was disabled initially)
    const handleTerrainChange = () => {
      if (!mapRef.current) return
      // Small delay to allow terrain tiles to start loading
      setTimeout(addModels, 500)
    }
    
      map.on('sourcedata', handleTerrainChange)

    const container = map.getContainer()
    container.addEventListener('modelLoadError', handleModelError)
    container.addEventListener('modelLoaded', handleModelLoad)
    container.addEventListener('modelLoadProgress', handleModelProgress)

    // Add models when map style is loaded
    if (map.isStyleLoaded()) {
      addModels()
    } else {
      map.once('style.load', addModels)
    }

    // Cleanup: remove layers and event listeners when component unmounts
    return () => {
      const currentMap = mapRef.current
      if (!currentMap) return
      
      currentMap.off('sourcedata', handleTerrainChange)
      container.removeEventListener('modelLoadError', handleModelError)
      container.removeEventListener('modelLoaded', handleModelLoad)
      container.removeEventListener('modelLoadProgress', handleModelProgress)
      
      memoizedModels.forEach((modelConfig) => {
        try {
          if (currentMap.getLayer(modelConfig.id)) {
            currentMap.removeLayer(modelConfig.id)
            layersAdded.current.delete(modelConfig.id)
          }
        } catch (error) {
          // Map might already be destroyed, ignore errors silently
          // Log only in development mode if needed
        }
      })
    }
  }, [map, memoizedModels, modelVisibility, handleModelError, handleModelLoad, handleModelProgress])
  
  // Update model visibility when visibility state changes
  useEffect(() => {
    if (!mapRef.current) return
    
    const currentMap = mapRef.current
    memoizedModels.forEach((modelConfig) => {
      if (currentMap.getLayer(modelConfig.id)) {
        const isVisible = modelVisibility[modelConfig.id] !== false
        currentMap.setLayoutProperty(modelConfig.id, 'visibility', isVisible ? 'visible' : 'none')
      }
    })
  }, [memoizedModels, modelVisibility])
}

