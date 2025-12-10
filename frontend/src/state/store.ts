import { create } from 'zustand'

type State = {
  // Selected tourist spot
  selectedTouristSpot: string | null
  setSelectedTouristSpot: (id: string | null) => void
  
  // Map viewport state
  mapViewport: {
    center: [number, number]
    zoom: number
    pitch: number
    bearing: number
  } | null
  setMapViewport: (viewport: State['mapViewport']) => void
  
  // Loading states
  loadingStates: Record<string, boolean>
  setLoadingState: (key: string, loading: boolean) => void
  
  // Error states
  errors: Record<string, string | null>
  setError: (key: string, error: string | null) => void
  
  // Model visibility toggles
  modelVisibility: Record<string, boolean>
  toggleModelVisibility: (id: string) => void
  setModelVisibility: (id: string, visible: boolean) => void
  
  // Performance mode for lower-end devices (Raspberry Pi, etc.)
  // When true, only one of terrain or models can be enabled at a time
  performanceMode: boolean
  setPerformanceMode: (enabled: boolean) => void
  
  // 3D features enabled state
  terrainEnabled: boolean
  modelsEnabled: boolean
  setTerrainEnabled: (enabled: boolean) => void
  setModelsEnabled: (enabled: boolean) => void
}

export const useStore = create<State>((set) => ({
  selectedTouristSpot: null,
  setSelectedTouristSpot: (id) => set({ selectedTouristSpot: id }),
  
  mapViewport: null,
  setMapViewport: (viewport) => set({ mapViewport: viewport }),
  
  loadingStates: {},
  setLoadingState: (key, loading) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading }
    })),
  
  errors: {},
  setError: (key, error) =>
    set((state) => ({
      errors: { ...state.errors, [key]: error }
    })),
  
  modelVisibility: {},
  toggleModelVisibility: (id) =>
    set((state) => ({
      modelVisibility: {
        ...state.modelVisibility,
        [id]: !state.modelVisibility[id]
      }
    })),
  setModelVisibility: (id, visible) =>
    set((state) => ({
      modelVisibility: { ...state.modelVisibility, [id]: visible }
    })),
  
  // Performance mode defaults to false (both features can be enabled)
  performanceMode: false,
  setPerformanceMode: (enabled) => set({ performanceMode: enabled }),
  
  // Both enabled by default
  terrainEnabled: true,
  modelsEnabled: true,
  setTerrainEnabled: (enabled) => {
    set((state) => {
      // In performance mode, if enabling terrain, disable models
      if (state.performanceMode && enabled && state.modelsEnabled) {
        return { terrainEnabled: enabled, modelsEnabled: false }
      }
      // If not in performance mode, just update terrain
      return { terrainEnabled: enabled }
    })
  },
  setModelsEnabled: (enabled) => {
    set((state) => {
      // In performance mode, if enabling models, disable terrain
      if (state.performanceMode && enabled && state.terrainEnabled) {
        return { modelsEnabled: enabled, terrainEnabled: false }
      }
      // If not in performance mode, just update models
      return { modelsEnabled: enabled }
    })
  }
}))

