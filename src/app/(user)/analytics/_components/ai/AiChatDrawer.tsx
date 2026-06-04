'use client'

// "Ask your data" — streaming chat grounded in the current analytics
// snapshot. Slide-over drawer from the right (framer-motion spring).

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { ChatMessage } from '@/services/types/analytics'

interface AiChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'Which grade is struggling the most?',
  'Who dropped the most vs the compared term?',
  'Which assessments look too hard?',
  'Summarize this view in two sentences',
]

const AiChatDrawer: React.FC<AiChatDrawerProps> = ({ isOpen, onClose }) => {
  const serializedContext = useAnalyticsStore((s) => s.serializedContext)
  const viewLevel = useAnalyticsStore((s) => s.snapshot?.viewLevel)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isOpen])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming || !serializedContext) return

    const history = [...messages, { role: 'user', content: trimmed } as ChatMessage]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: serializedContext,
          messages: history.slice(0, -1),
          newMessage: trimmed,
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Chat failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assembled = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        assembled += decoder.decode(value, { stream: true })
        const current = assembled
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: current }
          return updated
        })
      }
      if (!assembled) throw new Error('Empty response')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat failed'
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `⚠️ ${message} — please try again.`,
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-teal-50">
              <div>
                <h2 className="text-base font-semibold text-slate-900 inline-flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-cyan-500" />
                  Ask Your Data
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grounded in the current {viewLevel || 'school'} view
                </p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    disabled={streaming}
                    aria-label="Clear chat"
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg disabled:opacity-40 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close chat"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="pt-8 text-center">
                  <SparklesIcon className="w-8 h-8 text-cyan-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Ask anything about the data you&apos;re viewing.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'ml-auto bg-cyan-600 text-white rounded-2xl rounded-tr-md'
                      : 'mr-auto bg-slate-100 text-slate-800 rounded-2xl rounded-tl-md'
                  }`}
                >
                  {m.content}
                  {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-cyan-500 animate-pulse align-text-bottom rounded-sm" />
                  )}
                </div>
              ))}
            </div>

            {/* Suggestions — always available, even mid-conversation */}
            <div className="border-t border-slate-100 px-3 pt-2.5">
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={streaming || !serializedContext}
                    className="flex-shrink-0 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 pt-1.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  rows={2}
                  placeholder={serializedContext ? 'Ask about this view…' : 'Load data first…'}
                  disabled={!serializedContext}
                  className="flex-1 resize-none px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim() || !serializedContext}
                  aria-label="Send message"
                  className="p-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 disabled:opacity-40 transition-all"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Answers come only from the loaded analytics data
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AiChatDrawer
