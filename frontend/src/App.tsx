import React, { Suspense, lazy, useState, useEffect } from 'react'
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
  
  // Detect mobile screen size
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 // md breakpoint
    }
    return false
  })

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sidebar is always open by default - persist state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Check localStorage for saved preference, default to true on desktop, false on mobile
    const saved = localStorage.getItem('sidebarOpen')
    if (saved !== null) return saved === 'true'
    return typeof window !== 'undefined' && window.innerWidth >= 768
  })

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isSidebarOpen))
  }, [isSidebarOpen])

  // Automatically open sidebar when Discover page loads (desktop only)
  useEffect(() => {
    if (isDiscoverPage && !isMobile && !isSidebarOpen) {
      setIsSidebarOpen(true)
    }
    // On mobile, keep sidebar closed by default
    if (isDiscoverPage && isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isDiscoverPage, isMobile])

  // Handle place selection from chatbot
  const handlePlaceSelect = (place: PlaceInfo) => {
    // Navigate to discover page with the place coordinates
    // This will be handled by the map component
    console.log('Selected place:', place)
    // You can implement navigation to the place on the map here
    // For now, we just log it
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
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
      <Navigation isSidebarOpen={isSidebarOpen} />

      <ErrorBoundary>
        {/* Mobile: flex-col (map on top, sidebar bottom sheet), Desktop: flex-row (side by side) */}
        <div className={`h-full ${isMobile ? 'flex flex-col' : 'flex'} ${isMobile ? '' : 'p-1 gap-1'}`}>
          {/* Main Content Area */}
          <div 
            className={`h-full transition-all duration-300 ${isMobile ? '' : 'rounded-xl'}`}
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              minWidth: 0,
              width: isMobile 
                ? '100%' 
                : (isDiscoverPage && isSidebarOpen ? 'calc(70% - 0.125rem)' : '100%'),
              height: isMobile && isDiscoverPage && isSidebarOpen ? '50%' : isMobile ? '100%' : '100%',
              flexShrink: 0
            }}
          >
            <Suspense fallback={<div className="p-8 text-center pt-20">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover isSidebarOpen={isSidebarOpen} />} />
              </Routes>
            </Suspense>
          </div>

          {/* Toggle Button - Only show on Discover page when sidebar is closed (desktop only) */}
          {isDiscoverPage && !isSidebarOpen && !isMobile && (
            <button
              onClick={toggleSidebar}
              className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110"
              style={{
                backgroundColor: '#3a3a3a',
                color: '#e5e5e5'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#444444'
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3a3a3a'
                e.currentTarget.style.opacity = '1'
              }}
              aria-label="Open Pathfinder AI chat"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}

          {/* Pathfinder AI Sidebar/Bottom Sheet - Only show on Discover page */}
          {isDiscoverPage && (
            <ChatBubble 
              onPlaceSelect={handlePlaceSelect}
              isOpen={isSidebarOpen}
              onToggle={toggleSidebar}
              isMobile={isMobile}
            />
          )}
        </div>
      </ErrorBoundary>

      <ToastContainer />
    </div>
  )
}
