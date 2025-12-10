import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import ToastContainer from './components/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'
import ChatBubble from './components/ChatBubble'
import type { PlaceInfo } from './types/api'

// Lazy load route components for code splitting
const Home = lazy(() => import('./routes/Home'))
const Discover = lazy(() => import('./routes/Discover'))

export default function App(){
  const location = useLocation()
  const isDiscoverPage = location.pathname === '/discover'

  // Handle place selection from chatbot
  const handlePlaceSelect = (place: PlaceInfo) => {
    // Navigate to discover page with the place coordinates
    // This will be handled by the map component
    console.log('Selected place:', place)
    // You can implement navigation to the place on the map here
    // For now, we just log it
  }

  return (
    <div 
      className={`h-screen w-screen overflow-hidden ${!isDiscoverPage ? 'bg-white' : ''}`} 
      style={{ 
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      <Navigation />

      <ErrorBoundary>
        <Suspense fallback={<div className="p-8 text-center pt-20">Loading...</div>}>
          <div 
            className="h-full w-full" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              margin: 0,
              padding: 0
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
            </Routes>
          </div>
        </Suspense>
      </ErrorBoundary>

      <ToastContainer />
      
      {/* Pathfinder AI Chat Bubble */}
      <ChatBubble onPlaceSelect={handlePlaceSelect} />
    </div>
  )
}
