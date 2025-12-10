import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home(){
  const navigate = useNavigate()

  // Memoize features to prevent re-creation on every render
  const features = useMemo(() => [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: "3D Map Experience",
      description: "Maplibre + Three.js for immersive 3D building overlays",
      color: "var(--seafoam-blue)",
      bgColor: "rgba(54, 120, 196, 0.1)"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "State Management",
      description: "Zustand for efficient and lightweight state handling",
      color: "var(--forest-green)",
      bgColor: "rgba(74, 124, 89, 0.1)"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: "Offline Storage",
      description: "Localforage for seamless offline data persistence",
      color: "var(--sunlit-gold)",
      bgColor: "rgba(255, 199, 44, 0.1)"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      title: "Rich UI Components",
      description: "Toasts, error boundaries, and modern UI patterns",
      color: "var(--coral-pink)",
      bgColor: "rgba(255, 107, 107, 0.1)"
    }
  ], [])

  return (
    <div className="h-full w-full pt-24 overflow-y-auto relative">
      {/* Simple solid background - no gradients for performance */}
      <div className="fixed inset-0" style={{ backgroundColor: 'var(--seafoam-blue)' }}></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 rounded-full text-white text-sm font-semibold border border-white/30" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              ✨ Next-Gen Travel Experience
            </span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black mb-6 text-white leading-tight">
            IoTinerary
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Explore Catanduanes with immersive 3D maps, intelligent itinerary planning, and AI-powered recommendations
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-10 py-5 bg-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-lg"
            style={{ color: 'var(--seafoam-blue)' }}
          >
            <span className="flex items-center gap-3">
              Start Exploring
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>

        {/* Features Grid - simplified for performance */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative rounded-3xl p-8 shadow-lg border border-white/20"
              style={{ backgroundColor: feature.bgColor }}
            >
              <div className="relative z-10">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg"
                  style={{ backgroundColor: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed text-lg">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section - simplified */}
        <div className="rounded-3xl p-12 shadow-lg border border-white/20" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-6xl font-black mb-4" style={{ color: 'var(--sunlit-gold)' }}>
                3D
              </div>
              <div className="text-white/90 font-semibold text-lg">Interactive Maps</div>
            </div>
            <div>
              <div className="text-6xl font-black mb-4" style={{ color: 'var(--coral-pink)' }}>
                100%
              </div>
              <div className="text-white/90 font-semibold text-lg">Offline Ready</div>
            </div>
            <div>
              <div className="text-6xl font-black mb-4" style={{ color: 'var(--forest-green)' }}>
                AI
              </div>
              <div className="text-white/90 font-semibold text-lg">Powered Features</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

