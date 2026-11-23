'use client'

// The top of the admin panel: what needs someone now, worst first
// (lib/adminOverview attentionItems). Each item is a count, what it counts,
// and what to do: Review or Sync now right here, or Open the page with its
// filters set. "Nothing needs you" shows only when every area answered
// (lib/adminOverview attentionState), so a failed load never reads as "all clear".

import React from 'react'
import Link from 'next/link'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { attentionSentence, plural, type AttentionItem, type AttentionState } from '@/lib/adminOverview'

interface AttentionCardProps {
  state: AttentionState
  items: AttentionItem[]
  /** Some areas didn't load, so the list may be missing something. */
  partial: boolean
  /** The item whose action is running. */
  busyId: string | null
  onAction: (item: AttentionItem) => void
  onRetry: () => void
}

const RAIL = { items: 'bg-amber-400', clear: 'bg-emerald-400', quiet: 'bg-slate-200' } as const

const Marker = ({ item }: { item: AttentionItem }) => {
  const color = item.tone === 'bad' ? 'text-rose-600' : 'text-amber-600'
  if (item.count !== null)
    return <span className={`font-display text-2xl font-semibold leading-none tabular-nums ${color}`}>{item.count}</span>
  const Icon = item.tone === 'bad' ? ExclamationCircleIcon : ExclamationTriangleIcon
  return <Icon className={`h-6 w-6 ${color}`} aria-hidden />
}

interface RowProps {
  marker: React.ReactNode
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const Row = ({ marker, children, actions, className = '', style }: RowProps) => (
  <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3 pl-6 pr-4 sm:flex-nowrap ${className}`} style={style}>
    <span className="flex w-9 shrink-0 justify-end">{marker}</span>
    {/* basis-48: on a phone the actions drop under the words instead of squeezing them. */}
    <div className="min-w-0 flex-1 basis-48 text-sm text-slate-800">{children}</div>
    {actions && <div className="ml-[3.25rem] flex shrink-0 items-center gap-1.5 sm:ml-0">{actions}</div>}
  </li>
)

const quietButton =
  'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

const AttentionCard: React.FC<AttentionCardProps> = ({ state, items, partial, busyId, onAction, onRetry }) => {
  const rail = state === 'items' ? RAIL.items : state === 'clear' ? RAIL.clear : RAIL.quiet

  return (
    <section
      aria-labelledby="attention-heading"
      aria-busy={state === 'loading'}
      className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <span className={`absolute inset-y-0 left-0 w-1 transition-colors ${rail}`} aria-hidden />
      <div className="flex items-baseline justify-between gap-3 pb-1 pl-6 pr-5 pt-4">
        <h2 id="attention-heading" className="font-display text-base font-semibold text-slate-900">
          Needs your attention
        </h2>
        {state === 'items' && <span className="text-xs tabular-nums text-slate-500">{plural(items.length, 'item')}</span>}
      </div>

      <ul className="divide-y divide-slate-100" aria-live="polite">
        {state === 'loading' &&
          [0, 1].map((i) => (
            <Row key={i} marker={<span className="h-6 w-6 rounded-lg bg-slate-100 motion-safe:animate-pulse" />}>
              <span className="block h-3 w-56 max-w-full rounded-full bg-slate-100 motion-safe:animate-pulse" />
            </Row>
          ))}

        {state === 'failed' && (
          <Row
            marker={<ExclamationCircleIcon className="h-6 w-6 text-slate-400" aria-hidden />}
            actions={
              <button type="button" onClick={onRetry} className={quietButton}>
                Try again
              </button>
            }
          >
            Live status didn’t load. Every tool below still opens.
          </Row>
        )}

        {state === 'unsure' && (
          <Row
            marker={<ExclamationCircleIcon className="h-6 w-6 text-slate-400" aria-hidden />}
            actions={
              <button type="button" onClick={onRetry} className={quietButton}>
                Try again
              </button>
            }
          >
            <p className="font-medium text-slate-900">Some areas couldn’t be checked</p>
            <p className="mt-0.5 text-xs text-slate-500">Nothing is waiting in the rest. Their rows say which didn’t load.</p>
          </Row>
        )}

        {state === 'clear' && (
          <Row marker={<CheckCircleIcon className="h-6 w-6 text-emerald-500" aria-hidden />}>
            <p className="font-medium text-slate-900">Nothing needs you right now</p>
            <p className="mt-0.5 text-xs text-slate-500">Approvals, messages and the rest of what you look after are up to date.</p>
          </Row>
        )}

        {state === 'items' &&
          items.map((item, i) => (
            <Row
              key={item.id}
              className="motion-safe:animate-[ribbonIn_.35s_ease-out_both]"
              style={{ animationDelay: `${i * 40}ms` }}
              marker={<Marker item={item} />}
              actions={
                <>
                  {item.action && (
                    <button
                      type="button"
                      onClick={() => onAction(item)}
                      disabled={busyId === item.id}
                      className="cursor-pointer rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
                    >
                      {busyId === item.id ? 'Working' : item.action.label}
                    </button>
                  )}
                  <Link href={item.href} aria-label={`Open: ${attentionSentence(item)}`} className={quietButton}>
                    Open
                  </Link>
                </>
              }
            >
              {item.text}
            </Row>
          ))}
      </ul>

      {partial && state === 'items' && (
        <p className="border-t border-slate-100 py-2.5 pl-6 pr-5 text-xs text-slate-500">
          Some areas didn’t load, so this list may be missing something.{' '}
          <button type="button" onClick={onRetry} className="cursor-pointer font-medium text-cyan-700 hover:underline">
            Try again
          </button>
        </p>
      )}
    </section>
  )
}

export default AttentionCard
