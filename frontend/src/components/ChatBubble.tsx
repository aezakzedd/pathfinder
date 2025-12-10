import React, { useState, useRef, useEffect } from 'react'
import { chatWithAi } from '../lib/api'
import type { ChatMessage, PlaceInfo } from '../types/api'

interface ChatBubbleProps {
  onPlaceSelect?: (place: PlaceInfo) => void
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
}

export default function ChatBubble({ onPlaceSelect, isOpen, onToggle, isMobile = false }: ChatBubbleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Pathfinder, your Catanduanes tourism guide. Ask me about beaches, surfing spots, waterfalls, hotels, or anything about the island! 🌴",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Mark that initial mount is complete
    isInitialMount.current = false
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatWithAi(userMessage.content)
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        places: response.places,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      const isTimeout = errorMsg.toLowerCase().includes('timeout')
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: isTimeout 
          ? "I'm still warming up! The AI model is loading for the first time (this can take 1-2 minutes). Please try again in a moment! ⏳"
          : `Sorry, I encountered an error: ${errorMsg}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceClick = (place: PlaceInfo) => {
    if (onPlaceSelect) {
      onPlaceSelect(place)
    }
  }

  const getPlaceIcon = (type: string): string => {
    const icons: Record<string, string> = {
      surfing: '🏄',
      swimming: '🏊',
      hiking: '🥾',
      sightseeing: '👀',
      accommodation: '🏨',
      food: '🍽️',
      transport: '✈️'
    }
    return icons[type] || '📍'
  }

  // Mobile: bottom sheet, Desktop: right sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Sheet */}
        <div
          className={`fixed left-0 right-0 z-[9998] ${
            isInitialMount.current ? '' : 'transition-all duration-300 ease-in-out'
          }`}
          style={{
            bottom: isOpen ? '0' : '-100%',
            height: isOpen ? '60%' : '0%',
            backgroundColor: '#1a1a1a',
            borderTop: isOpen ? '1px solid #2d2d2d' : 'none',
            borderTopLeftRadius: isOpen ? '1rem' : '0',
            borderTopRightRadius: isOpen ? '1rem' : '0',
            boxShadow: isOpen ? '0 -4px 12px rgba(0, 0, 0, 0.3)' : 'none',
            overflow: 'hidden'
          }}
        >
          {/* Drag Handle */}
          {isOpen && (
            <div className="w-full flex justify-center py-2 cursor-grab active:cursor-grabbing" onClick={onToggle}>
              <div className="w-12 h-1 bg-[#2d2d2d] rounded-full"></div>
            </div>
          )}
          
          {/* Sidebar Content */}
          <div className={`h-full flex flex-col ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ height: isOpen ? 'calc(100% - 24px)' : '0' }}>
            {/* Header */}
            <div 
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{
                backgroundColor: '#1f1f1f',
                borderBottom: '1px solid #2d2d2d'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#2d2d2d' }}
                >
                  <span className="text-lg">🧭</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: '#e5e5e5' }}>Chat</h3>
                  <p className="text-xs" style={{ color: '#888888' }}>Pathfinder AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded transition-colors"
                  style={{ 
                    color: '#888888',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d2d2d'
                    e.currentTarget.style.color = '#e5e5e5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#888888'
                  }}
                  aria-label="Close sidebar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages - reuse the same component structure */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2.5 ${
                      message.role === 'user' ? 'ml-auto' : ''
                    }`}
                    style={
                      message.role === 'user'
                        ? {
                            backgroundColor: '#3a3a3a',
                            color: '#e5e5e5'
                          }
                        : {
                            backgroundColor: '#252525',
                            color: '#e5e5e5',
                            border: '1px solid #2d2d2d'
                          }
                    }
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Places */}
                    {message.places && message.places.length > 0 && (
                      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid #2d2d2d' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#888888' }}>
                          📍 Related Places
                        </p>
                        {message.places.map((place, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePlaceClick(place)}
                            className="w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 group"
                            style={{
                              backgroundColor: '#1f1f1f',
                              border: '1px solid #2d2d2d'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#252525'
                              e.currentTarget.style.borderColor = '#3a3a3a'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#1f1f1f'
                              e.currentTarget.style.borderColor = '#2d2d2d'
                            }}
                          >
                            <span className="text-base">{getPlaceIcon(place.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="text-sm font-medium truncate transition-colors"
                                style={{ color: '#e5e5e5' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#e5e5e5'}
                              >
                                {place.name}
                              </p>
                              <p className="text-xs capitalize" style={{ color: '#888888' }}>{place.type}</p>
                            </div>
                            <svg 
                              className="w-4 h-4 transition-colors flex-shrink-0" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              style={{ color: '#888888' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#b0b0b0'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p 
                      className="text-xs mt-1.5"
                      style={{ 
                        color: message.role === 'user' ? 'rgba(229, 229, 229, 0.6)' : '#888888'
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div 
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: '#252525',
                      color: '#e5e5e5',
                      border: '1px solid #2d2d2d'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#888888', animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#888888', animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#888888', animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm" style={{ color: '#888888' }}>Pathfinder is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSubmit} 
              className="p-3 flex-shrink-0"
              style={{
                backgroundColor: '#1f1f1f',
                borderTop: '1px solid #2d2d2d'
              }}
            >
              <div 
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: '#252525',
                  border: '1px solid #2d2d2d'
                }}
              >
                <button
                  type="button"
                  className="p-1 rounded transition-colors"
                  style={{ color: '#888888' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d2d2d'
                    e.currentTarget.style.color = '#e5e5e5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#888888'
                  }}
                  aria-label="Attach"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Catanduanes..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{
                    color: '#e5e5e5'
                  }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded transition-colors"
                  style={
                    input.trim() && !isLoading
                      ? {
                          backgroundColor: '#3a3a3a',
                          color: '#e5e5e5'
                        }
                      : {
                          color: '#555555',
                          cursor: 'not-allowed'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (input.trim() && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#444444'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (input.trim() && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#3a3a3a'
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile: Floating button to open bottom sheet */}
        {!isOpen && (
          <button
            onClick={onToggle}
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
      </>
    )
  }

  // Desktop: Right Sidebar
  return (
    <div
      className={`h-full flex-shrink-0 ${
        isInitialMount.current ? '' : 'transition-all duration-300 ease-in-out'
      } ${isOpen ? 'rounded-xl' : ''}`}
      style={{
        width: isOpen ? 'calc(30% - 0.125rem)' : '0%',
        backgroundColor: '#1a1a1a',
        borderLeft: isOpen ? '1px solid #2d2d2d' : 'none',
        boxShadow: isOpen ? '-4px 0 12px rgba(0, 0, 0, 0.3)' : 'none',
        overflow: isOpen ? 'hidden' : 'hidden',
        minWidth: isOpen ? '350px' : '0px',
        maxWidth: isOpen ? '450px' : '0px'
      }}
    >
      {/* Sidebar Content */}
      <div className={`h-full flex flex-col ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{
            backgroundColor: '#1f1f1f',
            borderBottom: '1px solid #2d2d2d'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#2d2d2d' }}
            >
              <span className="text-lg">🧭</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#e5e5e5' }}>Chat</h3>
              <p className="text-xs" style={{ color: '#888888' }}>Pathfinder AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="p-1.5 rounded transition-colors"
              style={{ 
                color: '#888888',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d2d2d'
                e.currentTarget.style.color = '#e5e5e5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#888888'
              }}
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2.5 ${
                  message.role === 'user' ? 'ml-auto' : ''
                }`}
                style={
                  message.role === 'user'
                    ? {
                        backgroundColor: '#3a3a3a',
                        color: '#e5e5e5'
                      }
                    : {
                        backgroundColor: '#252525',
                        color: '#e5e5e5',
                        border: '1px solid #2d2d2d'
                      }
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                
                {/* Places */}
                {message.places && message.places.length > 0 && (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid #2d2d2d' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#888888' }}>
                      📍 Related Places
                    </p>
                    {message.places.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePlaceClick(place)}
                        className="w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 group"
                        style={{
                          backgroundColor: '#1f1f1f',
                          border: '1px solid #2d2d2d'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#252525'
                          e.currentTarget.style.borderColor = '#3a3a3a'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f1f1f'
                          e.currentTarget.style.borderColor = '#2d2d2d'
                        }}
                      >
                        <span className="text-base">{getPlaceIcon(place.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-medium truncate transition-colors"
                            style={{ color: '#e5e5e5' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#e5e5e5'}
                          >
                            {place.name}
                          </p>
                          <p className="text-xs capitalize" style={{ color: '#888888' }}>{place.type}</p>
                        </div>
                        <svg 
                          className="w-4 h-4 transition-colors flex-shrink-0" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          style={{ color: '#888888' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#b0b0b0'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
                
                <p 
                  className="text-xs mt-1.5"
                  style={{ 
                    color: message.role === 'user' ? 'rgba(229, 229, 229, 0.6)' : '#888888'
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div 
                className="rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor: '#252525',
                  color: '#e5e5e5',
                  border: '1px solid #2d2d2d'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#888888', animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#888888', animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#888888', animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm" style={{ color: '#888888' }}>Pathfinder is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form 
          onSubmit={handleSubmit} 
          className="p-3"
          style={{
            backgroundColor: '#1f1f1f',
            borderTop: '1px solid #2d2d2d'
          }}
        >
          <div 
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              backgroundColor: '#252525',
              border: '1px solid #2d2d2d'
            }}
          >
            <button
              type="button"
              className="p-1 rounded transition-colors"
              style={{ color: '#888888' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d2d2d'
                e.currentTarget.style.color = '#e5e5e5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#888888'
              }}
              aria-label="Attach"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Catanduanes..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{
                color: '#e5e5e5'
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded transition-colors"
              style={
                input.trim() && !isLoading
                  ? {
                      backgroundColor: '#3a3a3a',
                      color: '#e5e5e5'
                    }
                  : {
                      color: '#555555',
                      cursor: 'not-allowed'
                    }
              }
              onMouseEnter={(e) => {
                if (input.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#444444'
                }
              }}
              onMouseLeave={(e) => {
                if (input.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#3a3a3a'
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

