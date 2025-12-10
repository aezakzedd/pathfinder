import { Model3DConfig } from '../types/model'

interface TouristSpotInfoProps {
  spot: Model3DConfig | null
  onClose: () => void
}

export default function TouristSpotInfo({ spot, onClose }: TouristSpotInfoProps) {
  if (!spot) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[1000]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800" id="spot-info-title">{spot.name || spot.id}</h2>
          <button
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close tourist spot information"
            aria-controls="spot-info-title"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Location</h3>
            <p className="text-gray-700">
              {spot.coordinates[1].toFixed(6)}, {spot.coordinates[0].toFixed(6)}
            </p>
          </div>
          
          {spot.altitude !== undefined && spot.altitude > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Altitude</h3>
              <p className="text-gray-700">{spot.altitude}m</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClose()
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Close tourist spot information"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

