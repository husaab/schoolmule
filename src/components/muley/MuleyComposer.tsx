'use client'
// Where the person types to Muley. Enter sends, Shift+Enter starts a new
// line; on a touch keyboard Enter is a new line and the button sends.

import { useEffect, useRef } from 'react'
import { ArrowUpIcon, StopIcon } from '@heroicons/react/24/solid'

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  streaming: boolean
  maxLength: number
  autoFocus: boolean
}

const touchKeyboard = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export default function MuleyComposer({ value, onChange, onSend, onStop, streaming, maxLength, autoFocus }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  useEffect(() => {
    if (autoFocus && !touchKeyboard()) ref.current?.focus()
  }, [autoFocus])

  const canSend = value.trim().length > 0 && !streaming
  return (
    <form
      className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-100"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSend()
      }}
    >
      <label htmlFor="muley-input" className="sr-only">Message Muley</label>
      <textarea
        id="muley-input"
        ref={ref}
        rows={1}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !touchKeyboard()) {
            e.preventDefault()
            if (canSend) onSend()
          }
        }}
        placeholder="Ask Muley…"
        className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-700 text-white hover:bg-slate-800"
        >
          <StopIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
