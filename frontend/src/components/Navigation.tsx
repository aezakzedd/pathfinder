import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavigationProps {
  isSidebarOpen: boolean
}

export default function Navigation({ isSidebarOpen }: NavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path
  const isDiscoverPage = location.pathname === '/discover'

  // Detect mobile
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <nav 
      className="flex justify-center fixed left-0 z-40 transition-all duration-300" 
      role="navigation" 
      aria-label="Main navigation" 
      style={{ 
        pointerEvents: 'none',
        right: !isMobile && isDiscoverPage && isSidebarOpen ? '30%' : '0',
        top: isMobile ? '5px' : '10px',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        paddingBottom: '1.25rem'
      }}
    >
      <div className="flex gap-2 rounded-2xl px-3 py-2.5" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={() => navigate('/')}
          aria-label="Navigate to home page"
          aria-current={isActive('/') ? 'page' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/')
            }
          }}
          className={`
            py-3 rounded-xl font-bold text-sm
            transition-all duration-300 ease-out
            relative overflow-hidden group
            ${isActive('/') 
              ? 'text-white shadow-xl scale-105' 
              : 'text-gray-800 hover:text-white bg-white hover:bg-gray-100'
            }
          `}
          style={{ 
            minWidth: '100px',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            backgroundColor: isActive('/') ? 'var(--seafoam-blue)' : '#ffffff'
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </span>
        </button>
        <button
          onClick={() => navigate('/discover')}
          aria-label="Navigate to discover page"
          aria-current={isActive('/discover') ? 'page' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/discover')
            }
          }}
          className={`
            py-3 rounded-xl font-bold text-sm
            transition-all duration-300 ease-out
            relative overflow-hidden group
            ${isActive('/discover') 
              ? 'text-white shadow-xl scale-105' 
              : 'text-gray-800 hover:text-white bg-white hover:bg-gray-100'
            }
          `}
          style={{ 
            minWidth: '100px',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            backgroundColor: isActive('/discover') ? 'var(--seafoam-blue)' : '#ffffff'
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Discover
          </span>
        </button>
      </div>
    </nav>
  )
}

