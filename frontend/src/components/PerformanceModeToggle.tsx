/**
 * Performance Modeggle Component
 * Expandable button that allows users to toggle 3D terrain and 3D models for lower-end devices
 * In performance mode, only one feature can be enabled at a time
 */
import { useState } from 'react'
import { useStore } from '../state/store'
import { Settings, Mountain, Box } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PerformanceModeToggle() {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    performanceMode,
    setPerformanceMode,
    terrainEnabled,
    modelsEnabled,
    setTerrainEnabled,
    setModelsEnabled
  } = useStore()

  const handlePerformanceModeToggle = () => {
    const newMode = !performanceMode
    setPerformanceMode(newMode)
    
    if (newMode) {
      // When enabling performance mode, disable one if both are enabled
      if (terrainEnabled && modelsEnabled) {
        // Keep terrain, disable models (terrain is less resource-intensive)
        setModelsEnabled(false)
        toast('Performance mode enabled. Models disabled to improve performance.', { icon: 'ℹ️' })
      } else {
        toast.success('Performance mode enabled. Only one 3D feature can be active at a time.')
      }
    } else {
      toast.success('Performance mode disabled. Both features can be enabled.')
    }
  }

  const handleTerrainToggle = () => {
    const newValue = !terrainEnabled
    setTerrainEnabled(newValue)
    
    if (performanceMode && newValue && modelsEnabled) {
      // In performance mode, disable models when enabling terrain
      setModelsEnabled(false)
      toast('Terrain enabled. Models disabled for better performance.', { icon: 'ℹ️' })
    } else if (newValue) {
      toast.success('3D terrain enabled')
    } else {
      toast('3D terrain disabled', { icon: 'ℹ️' })
    }
  }

  const handleModelsToggle = () => {
    const newValue = !modelsEnabled
    setModelsEnabled(newValue)
    
    if (performanceMode && newValue && terrainEnabled) {
      // In performance mode, disable terrain when enabling models
      setTerrainEnabled(false)
      toast('3D models enabled. Terrain disabled for better performance.', { icon: 'ℹ️' })
    } else if (newValue) {
      toast.success('3D models enabled')
    } else {
      toast('3D models disabled', { icon: 'ℹ️' })
    }
  }

  return (
    <div className="fixed top-28 right-2.5 z-[1000]">
      {/* Main Button - Fixed position */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
          aria-label="Performance settings"
          aria-expanded={isExpanded}
        >
          <Settings className="w-5 h-5 text-gray-700" />
        </button>

        {/* Expanded Panel - Absolute positioned to the left of button */}
        {isExpanded && (
          <div 
            className="absolute top-0 right-full mr-2 bg-white rounded-lg shadow-lg p-4 min-w-[280px]"
            role="toolbar"
            aria-label="Performance and 3D feature controls"
          >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance Settings</h3>
            <p className="text-xs text-gray-600 mb-3">
              For lower-end devices (Raspberry Pi, etc.)
            </p>
            
            {/* Performance Mode Toggle */}
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Performance Mode</span>
                <span className="text-xs text-gray-500">(Mutually exclusive)</span>
              </div>
              <input
                type="checkbox"
                checked={performanceMode}
                onChange={handlePerformanceModeToggle}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                aria-label="Toggle performance mode"
              />
            </label>
          </div>

          <div className="space-y-2 border-t pt-3">
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Mountain className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">3D Terrain</span>
              </div>
              <input
                type="checkbox"
                checked={terrainEnabled}
                onChange={handleTerrainToggle}
                disabled={false}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Toggle 3D terrain"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Box className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">3D Models</span>
              </div>
              <input
                type="checkbox"
                checked={modelsEnabled}
                onChange={handleModelsToggle}
                disabled={false}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Toggle 3D models"
              />
            </label>
          </div>

          {performanceMode && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Performance Mode:</strong> Only one 3D feature can be enabled at a time for better performance on lower-end devices.
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}

