import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

const EVENT_ID = '66666666-0001-0000-0000-000000000001'
const VENUE_ID = '11111111-0000-0000-0000-000000000001'

const QUICK_REPLIES = [
  "Where can I eat? 🍔",
  "Nearest restroom? 🚻",
  "Match score? 🏏",
  "Fastest exit? 🚪",
  "Find first aid 🏥",
  "Queue status? 📊",
  "WiFi info? 📶",
]

export default function SmartBot() {
  const [messages, setMessages] = useState([
    { role: 'bot', type: 'welcome', message: "👋 Hi! I'm **StadiumIQ SmartBot** — your AI venue assistant.\n\nAsk me anything about food, queues, restrooms, exits, match score, and more!\n\n🚫 No external AI — I run on a custom keyword intent engine.", suggestions: QUICK_REPLIES }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', message: msg }])
    setLoading(true)

    try {
      const res = await api.post('/api/chatbot/message', { message: msg, venue_id: VENUE_ID, event_id: EVENT_ID })
      setMessages(prev => [...prev, { role: 'bot', ...res.data }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', type: 'error', message: "⚠️ Sorry, I couldn't process that. Try again!" }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-gray-50/50 relative">
      {/* Header */}
      <div className="px-6 py-6 bg-white border-b border-gray-100 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-600/30">
            🤖
          </div>
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-wide text-gray-900">SMARTBOT</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Custom Intent Engine Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 py-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-auto mb-1 border border-blue-200 text-blue-600">
                🤖
              </div>
            )}
            <div className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-600/20'
              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-gray-200/50'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-line font-medium mb-1">
                {msg.message?.replace(/\*\*(.*?)\*\*/g, '$1')}
              </p>
              
              {msg.action && (
                <a href={msg.action.route} className="inline-flex items-center gap-2 mt-3 bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100">
                  {msg.action.label} <span className="transform transition-transform hover:translate-x-1">→</span>
                </a>
              )}
              
              {msg.suggestions && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {msg.suggestions.map((s, j) => (
                    <button key={j} onClick={() => sendMessage(s)}
                      className="text-xs font-bold bg-gray-50 text-gray-600 px-4 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all border border-gray-200 shadow-sm">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2 border border-blue-200">
                🤖
              </div>
            <div className="bg-white border border-gray-100 rounded-[24px] rounded-bl-sm px-5 py-4 shadow-md flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-gray-50 to-transparent">
        <div className="bg-white p-2 rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your question..."
            className="flex-1 bg-transparent px-4 py-3 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none" />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
        
        {/* Quick horizontal options just below the primary input for standard common inputs */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-4 scrollbar-hide">
          {QUICK_REPLIES.slice(0, 5).map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap border border-gray-200 shadow-sm">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
