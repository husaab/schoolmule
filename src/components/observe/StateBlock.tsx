// src/components/observe/StateBlock.tsx
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface StateBlockProps { kind: 'loading' | 'error' | 'empty' | 'ok'; message?: string; onRetry?: () => void; className?: string }

export default function StateBlock({ kind, message, onRetry, className = '' }: StateBlockProps) {
  if (kind === 'loading') {
    return (
      <div className={`space-y-2 py-6 ${className}`} aria-label="Loading">
        {[0, 1, 2].map((i) => <div key={i} className="h-3 rounded-full bg-white/[0.05] animate-pulse" style={{ width: `${85 - i * 20}%` }} />)}
      </div>
    )
  }
  const tone = kind === 'error' ? 'text-amber-300' : kind === 'ok' ? 'text-emerald-300' : 'text-slate-500'
  const Icon = kind === 'error' ? ExclamationTriangleIcon : kind === 'ok' ? CheckCircleIcon : ArrowPathIcon
  return (
    <div className={`flex flex-col items-center justify-center text-center py-8 ${className}`}>
      <Icon className={`h-6 w-6 mb-2 ${tone}`} />
      <p className={`text-sm ${tone}`}>{message ?? (kind === 'empty' ? 'Nothing in this window' : kind === 'ok' ? 'All clear' : 'Could not load')}</p>
      {kind === 'error' && onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs text-slate-300 underline underline-offset-4 hover:text-white">Retry</button>
      )}
    </div>
  )
}
