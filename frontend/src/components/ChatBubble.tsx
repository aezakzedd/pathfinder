import React, { useState, useRef, useEffect } from 'react'
import { chatWithAi } from '../lib/api'
import type { ChatMessage, PlaceInfo } from '../types/api'

interface ChatBubbleProps {
  onPlaceSelect?: (place: PlaceInfo) => void
}

export default function ChatBubble({ onPlaceSelect }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
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
      setIsOpen(false)
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

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
          isOpen 
            ? 'bg-gradient-to-br from-red-500 to-red-600 rotate-0' 
            : 'bg-gradient-to-br from-primary to-teal-600 animate-pulse'
        }`}
        style={{ 
          boxShadow: isOpen 
            ? '0 8px 32px rgba(239, 68, 68, 0.4)' 
            : '0 8px 32px rgba(44, 183, 180, 0.5)'
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Notification Badge */}
      {!isOpen && (
        <span className="fixed bottom-[76px] right-6 z-[10000] bg-accent text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
          Ask me!
        </span>
      )}

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          isOpen 
            ? 'scale-100 opacity-100 pointer-events-auto' 
            : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ 
          height: 'min(540px, calc(100vh - 150px))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-teal-500 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">🧭</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Pathfinder</h3>
            <p className="text-white/80 text-xs">Catanduanes Tourism Guide</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-white/80 text-xs">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white"
          style={{ height: 'calc(100% - 140px)' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-teal-500 text-white rounded-br-sm'
                    : 'bg-white text-slate-700 shadow-md border border-slate-100 rounded-bl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                
                {/* Places */}
                {message.places && message.places.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      📍 Related Places
                    </p>
                    {message.places.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePlaceClick(place)}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-primary/10 transition-colors flex items-center gap-2 group"
                      >
                        <span className="text-lg">{getPlaceIcon(place.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate group-hover:text-primary transition-colors">
                            {place.name}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">{place.type}</p>
                        </div>
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
                
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/60' : 'text-slate-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-700 shadow-md border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-slate-500">Pathfinder is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Catanduanes..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-primary to-teal-500 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Powered by Pathfinder AI
          </p>
        </form>
      </div>
    </>
  )
}

