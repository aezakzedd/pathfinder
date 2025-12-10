/**
 * Performance Mode Toggle Component
 * Simple button that toggles both 3D terrain and 3D models together
 */
import { useState } from 'react'
import { useStore } from '../state/store'
import { Settings, Box } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PerformanceModeToggle() {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    terrainEnabled,
    modelsEnabled,
    setTerrainEnabled,
    setModelsEnabled
  } = useStore()

  // Both are enabled if at least one is enabled
  const featuresEnabled = terrainEnabled || modelsEnabled

  const handle3DFeaturesToggle = () => {
    const newValue = !featuresEnabled
    
    // Toggle both terrain and models together
    setTerrainEnabled(newValue)
    setModelsEnabled(newValue)
    
    if (newValue) {
      toast.success('3D features enabled (terrain + models)')
    } else {
      toast('3D features disabled', { icon: 'ℹ️' })
    }
  }

  return (
    <div className="fixed top-28 right-2.5 z-[1000]">
      {/* Main Button - Fixed position */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
          aria-label="3D features settings"
          aria-expanded={isExpanded}
        >
          <Settings className="w-5 h-5 text-gray-700" />
        </button>

        {/* Expanded Panel - Absolute positioned to the left of button */}
        {isExpanded && (
          <div 
            className="absolute top-0 right-full mr-2 bg-white rounded-lg shadow-lg p-4 min-w-[240px]"
            role="toolbar"
            aria-label="3D feature controls"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">3D Features</h3>
            
            {/* Single 3D Features Toggle */}
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Box className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">3D Terrain + Models</span>
              </div>
              <input
                type="checkbox"
                checked={featuresEnabled}
                onChange={handle3DFeaturesToggle}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                aria-label="Toggle 3D features"
              />
            </label>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              Toggles both 3D terrain and 3D models together
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

