'use client'
import { useState } from 'react'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/20/solid'
import { copyText } from './errorReport'

export default function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied', className = '', primary = false }: { text: () => string; label?: string; copiedLabel?: string; className?: string; primary?: boolean }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const onClick = async () => {
    const ok = await copyText(text())
    setState(ok ? 'ok' : 'fail')
    setTimeout(() => setState('idle'), 1800)
  }
  const base = primary
    ? 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30 hover:bg-cyan-400/25'
    : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${base} ${className}`}>
      {state === 'ok' ? <CheckIcon className="h-4 w-4 text-emerald-300" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
      {state === 'ok' ? copiedLabel : state === 'fail' ? 'Copy failed' : label}
    </button>
  )
}
