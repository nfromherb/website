import { useState, useEffect, useRef, useCallback } from 'react'
import { ClaudeMessage, DashboardContext } from '@shared/types'
import { useDashboardContext } from '../../hooks/useDashboardContext'

interface ClaudePanelProps {
  context: ReturnType<typeof useDashboardContext>
}

const SUGGESTED_PROMPTS = [
  'Summarize my unread emails',
  "What's on my agenda today?",
  'What should I prioritize?',
  'Draft a note from my todos',
  "What's the news summary?"
]

export default function ClaudePanel({ context }: ClaudePanelProps) {
  const [messages, setMessages] = useState<ClaudeMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Claude, your personal assistant. I can see your emails, tasks, notes, weather, and news. What can I help you with?",
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamBuffer])

  // Register Claude streaming listener once
  useEffect(() => {
    const removeListener = window.api.claude.onToken((token, done) => {
      if (done) {
        setMessages((prev) => {
          const buffer = streamBuffer
          setStreamBuffer('')
          return [
            ...prev,
            {
              role: 'assistant' as const,
              content: buffer,
              timestamp: new Date().toISOString()
            }
          ]
        })
        setStreaming(false)
      } else {
        setStreamBuffer((prev) => prev + token)
      }
    })
    return removeListener
  }, [streamBuffer])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: ClaudeMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setStreamBuffer('')
    setStreaming(true)

    window.api.claude.sendMessage(text, context.context, messages)
  }, [input, streaming, messages, context.context])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <aside
      className="flex flex-col border-l border-white/5 z-40"
      style={{ width: 320, background: 'rgba(16,16,22,0.75)', backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="drag-region flex items-center gap-2.5 px-4 py-3 border-b border-white/5 pt-14">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold">
          C
        </div>
        <div>
          <div className="text-sm font-semibold text-white/90">Claude</div>
          <div className="text-xs text-white/30">Personal AI assistant</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${streaming ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}
          />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 selectable">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600/80 text-white rounded-br-sm'
                  : 'bg-white/8 text-white/90 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-white/8 text-white/90">
              {streamBuffer ? (
                <span className={streamBuffer.endsWith('▋') ? '' : 'typing-cursor'}>
                  {streamBuffer}
                </span>
              ) : (
                <span className="text-white/30 italic">Thinking…</span>
              )}
            </div>
          </div>
        )}

        {/* Suggested prompts when no messages */}
        {messages.length === 1 && !streaming && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-white/30 text-center">Try asking:</p>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setInput(p)
                  textareaRef.current?.focus()
                }}
                className="no-drag w-full text-left text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors cursor-default border border-white/5"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="no-drag px-3 pb-4 pt-2 border-t border-white/5">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude anything…"
            disabled={streaming}
            rows={1}
            className="glass-input flex-1 resize-none selectable min-h-[38px] max-h-[120px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="no-drag w-9 h-9 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-default transition-colors cursor-default flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-white/20 mt-1.5 text-center">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </aside>
  )
}
