/**
 * Component for toggling visibility of 3D models on the map
 */
import { useStore } from '../state/store'
import { Model3DConfig } from '../types/model'

interface ModelVisibilityToggleProps {
  models: Model3DConfig[]
}

export default function ModelVisibilityToggle({ models }: ModelVisibilityToggleProps) {
  const { modelVisibility, toggleModelVisibility, setModelVisibility } = useStore()

  return (
    <div 
      className="fixed top-20 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-h-[80vh] overflow-y-auto"
      role="toolbar"
      aria-label="Model visibility controls"
    >
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Tourist Spots</h3>
      <div className="space-y-2">
        {models.map((model) => {
          const isVisible = modelVisibility[model.id] !== false // Default to visible
          return (
            <label
              key={model.id}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => setModelVisibility(model.id, !isVisible)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                aria-label={`Toggle visibility of ${model.name || model.id}`}
              />
              <span className="text-sm text-gray-700">{model.name || model.id}</span>
            </label>
          )
        })}
      </div>
      <button
        onClick={() => {
          models.forEach((model) => setModelVisibility(model.id, true))
        }}
        className="mt-3 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        aria-label="Show all models"
      >
        Show All
      </button>
    </div>
  )
}

