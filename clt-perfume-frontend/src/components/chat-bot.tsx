"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"

type Message = {
  id: string
  text: string
  isBot: boolean
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Welcome to CLE Perfume. How can I assist you with our luxury collection today?", isBot: true }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { id: Date.now().toString(), text: input, isBot: false }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("https://justsearchdeveloper.app.n8n.cloud/webhook/42de5998-c7b3-421e-9fc4-7d936fd0037f/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId: sessionId,
          chatInput: userMessage.text
        })
      })

      const data = await response.json()
      if (data.output) {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: data.output, isBot: true }])
      }
    } catch (error) {
      console.error("Chat Error:", error)
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "I'm sorry, I'm having trouble connecting right now. Please try again later.", isBot: true }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Window Popup */}
      <div 
        className={`fixed bottom-[100px] right-6 z-50 w-[340px] h-[520px] max-h-[75vh] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right border border-neutral-200 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'}`}
        style={{ borderRadius: '1.25rem' }}
      >
        {/* Header Content */}
        <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-[15px] font-medium tracking-wide">Ask CLE</h3>
              <p className="text-[10px] text-neutral-300 mt-0.5">Typically replies immediately</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 w-full bg-neutral-50 p-4 overflow-y-auto flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
              <div 
                className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.isBot 
                    ? 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-sm shadow-sm' 
                    : 'bg-black text-white rounded-tr-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-neutral-100 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-neutral-100 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message CLE Consultant..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-5 pr-12 py-3.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-black transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-neutral-300 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4 ml-[1px]" />
            </button>
          </div>
        </form>
      </div>

      {/* Premium Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 focus:outline-none group overflow-hidden ${
          isOpen 
            ? 'w-[60px] h-[60px] rounded-full bg-white text-black border border-neutral-200' 
            : 'h-[60px] px-8 rounded-full bg-black text-white border border-white/10 gap-3'
        }`}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-500 group-hover:rotate-90" strokeWidth={1.5} />
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
              <span className="absolute -top-[2px] -right-[2px] flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </div>
            <span className="font-serif text-xs font-bold tracking-[0.2em] relative top-[1px] uppercase">Ask CLE</span>
          </>
        )}
      </button>
    </>
  )
}
