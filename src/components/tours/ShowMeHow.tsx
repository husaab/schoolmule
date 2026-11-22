// src/components/tours/ShowMeHow.tsx
// <ShowMeHow tour="publish-grades" /> — a link a feature can put anywhere (an
// empty screen, a header) that starts its tour. Renders nothing for someone
// the tour isn't for, or in a "View as" preview.
'use client'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { getTour, isAudience } from '@/lib/tours'
import { useTourStore } from '@/store/useTourStore'
import { useTourCtx } from './useTourCtx'

export default function ShowMeHow({ tour, label = 'Show me how', from = 0, className = '' }: { tour: string; label?: string; from?: number; className?: string }) {
  const ctx = useTourCtx()
  const dispatch = useTourStore((s) => s.dispatch)
  const def = getTour(tour)
  if (!def || ctx.impersonating || !isAudience(def, ctx)) return null
  return (
    <button
      type="button"
      onClick={() => dispatch({ t: 'START', tourId: tour, from })}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800 ${className}`}
    >
      <PlayCircleIcon className="h-4 w-4" />
      {label}
    </button>
  )
}
