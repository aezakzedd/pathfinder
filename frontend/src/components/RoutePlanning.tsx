import { useState, useCallback } from 'react'
import { fetchRouteOptions } from '../lib/api'
import type { Coordinates, RouteOption } from '../types/api'
import toast from 'react-hot-toast'

interface RoutePlanningProps {
  /** Starting coordinates [lng, lat] */
  from?: Coordinates
  /** Destination coordinates [lng, lat] */
  to?: Coordinates
  /** Callback when route is selected */
  onRouteSelect?: (route: RouteOption) => void
  /** Callback to close the panel */
  onClose?: () => void
}

/**
 * Route Planning Component
 * Displays route options from the /route-options endpoint
 * Allows users to select a route and see estimated travel times
 */
export default function RoutePlanning({
  from,
  to,
  onRouteSelect,
  onClose
}: RoutePlanningProps) {
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch route options from the API
   */
  const handleFetchRoutes = useCallback(async () => {
    if (!from || !to) {
      toast.error('Please select both start and destination points')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetchRouteOptions(from, to)
      setRoutes(response.options)
      if (response.options.length === 0) {
        toast('No route options available', { icon: 'ℹ️' })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch route options'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  /**
   * Handle route selection
   */
  const handleRouteSelect = useCallback((route: RouteOption) => {
    onRouteSelect?.(route)
    toast.success(`Selected ${route.id} route (${route.eta_mins} minutes)`)
  }, [onRouteSelect])

  /**
   * Format route name for display
   */
  const formatRouteName = (id: string): string => {
    return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ')
  }

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Route Planning</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close route planning"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {from && to && (
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">From:</span> {from[1].toFixed(6)}, {from[0].toFixed(6)}
            </p>
            <p>
              <span className="font-medium">To:</span> {to[1].toFixed(6)}, {to[0].toFixed(6)}
            </p>
          </div>
        )}

        <button
          onClick={handleFetchRoutes}
          disabled={loading || !from || !to}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading routes...' : 'Get Route Options'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {routes.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Available Routes:</h3>
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => handleRouteSelect(route)}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {formatRouteName(route.id)}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    {route.eta_mins} min
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

