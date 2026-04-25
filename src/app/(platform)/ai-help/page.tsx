'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'ai'
  content: string
}

export default function AiHelpPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am your research assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error || 'Failed to get response'}` }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'An error occurred while connecting to the AI.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen w-full bg-black relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">AI Research Assistant</h1>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Powered by Groq (Llama 3.1)
            </p>
          </div>
        </div>
        <a 
          href="https://groq.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
        >
          Groq ↗
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m, i) => (
            <div 
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {m.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center">
                <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your research..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.39 60.39 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.397 60.397 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
