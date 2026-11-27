'use client'
// A change Muley prepared: each student's value now and what it would be,
// and the one button that saves it. Nothing is written until the person
// presses Save; once saved, Undo puts it back for two weeks.

import { ArrowUturnLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { ActionEntry, MuleyCard } from '@/lib/muley/types'

export type ChangeStep = 'apply' | 'undo' | 'dismiss'

type Props = {
  card: Extract<MuleyCard, { type: 'change' }>
  entry: ActionEntry | undefined
  onAction: (actionId: string, step: ChangeStep) => void
  /** Ask Muley for something (to prepare the change again with today's values). */
  onAsk: (text: string) => void
  /** Muley is still answering: wait for it before saving. */
  streaming: boolean
}

export const PREPARE_AGAIN = 'Prepare that change again with the current values.'

const BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Needs your OK', className: 'bg-amber-100 text-amber-800' },
  applying: { label: 'Saving', className: 'bg-cyan-100 text-cyan-800' },
  applied: { label: 'Saved', className: 'bg-teal-100 text-teal-800' },
  undoing: { label: 'Undoing', className: 'bg-cyan-100 text-cyan-800' },
  undone: { label: 'Undone', className: 'bg-slate-100 text-slate-600' },
  rejected: { label: 'Dismissed', className: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Expired', className: 'bg-slate-100 text-slate-600' },
}

function Spinner({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-cyan-800">
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" aria-hidden="true" />
      {label}
    </p>
  )
}

const primary =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60'
const secondary =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60'

function Footer({ entry, onAction, onAsk, streaming }: Omit<Props, 'card'>) {
  if (!entry) return <p className="text-sm text-slate-500">This change is no longer available. Ask Muley again to see the current values.</p>
  const { action, busy, problem } = entry
  const stale = problem?.code === 'STALE'

  const problemBox = problem && (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <p className="flex items-start gap-2">
        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <span>{problem.message}</span>
      </p>
      {problem.conflicts.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 pl-6 text-[13px]">
          {problem.conflicts.map((c, i) => (
            <li key={i}>
              <span className="font-medium">{c.name}</span>: was {c.was}, now {c.now}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  if (action.status === 'pending') {
    if (busy === 'apply') return <Spinner label="Saving…" />
    if (busy === 'dismiss') return <Spinner label="Dismissing…" />
    return (
      <div className="space-y-2.5">
        {problemBox}
        <div className="flex flex-wrap items-center gap-2">
          {stale ? (
            <button type="button" onClick={() => onAsk(PREPARE_AGAIN)} disabled={streaming} className={primary}>
              Prepare it again
            </button>
          ) : (
            <button type="button" onClick={() => onAction(action.id, 'apply')} disabled={streaming} className={primary}>
              {action.applyLabel}
            </button>
          )}
          <button type="button" onClick={() => onAction(action.id, 'dismiss')} disabled={streaming} className={secondary}>
            Dismiss
          </button>
        </div>
        {!problem && <p className="text-xs text-slate-500">Nothing is saved until you press Save.</p>}
      </div>
    )
  }
  if (action.status === 'applying') return <Spinner label="Saving…" />
  if (action.status === 'undoing') return <Spinner label="Undoing…" />
  if (action.status === 'applied') {
    if (busy === 'undo') return <Spinner label="Undoing…" />
    return (
      <div className="space-y-2.5">
        {problemBox}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-teal-800">
            <CheckCircleIcon className="h-5 w-5 text-teal-600" aria-hidden="true" />
            {action.doneLabel}
          </p>
          {action.canUndo && !stale && (
            <button type="button" onClick={() => onAction(action.id, 'undo')} className={secondary}>
              <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
              {action.undoLabel}
            </button>
          )}
        </div>
      </div>
    )
  }
  if (action.status === 'undone') {
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-600">
        <ArrowUturnLeftIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
        {action.undoneLabel}
      </p>
    )
  }
  if (action.status === 'rejected') return <p className="text-sm text-slate-500">Dismissed. Nothing was saved.</p>
  // expired
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-600">This preview expired, so nothing was saved.</p>
      <button type="button" onClick={() => onAsk(PREPARE_AGAIN)} disabled={streaming} className={secondary}>
        Prepare it again
      </button>
    </div>
  )
}

export default function MuleyChangeCard({ card, entry, onAction, onAsk, streaming }: Props) {
  const badge = entry ? BADGE[entry.action.status] : null
  const [studentLabel = 'Student', nowLabel = 'Now', newLabel = 'New'] = card.columns
  return (
    <section aria-label={card.title} className="overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-[0_1px_3px_rgba(8,145,178,0.10)]">
      <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold text-slate-900">{card.title}</h3>
          {card.subtitle && <p className="text-xs text-slate-500">{card.subtitle}</p>}
        </div>
        {badge && <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badge.className}`}>{badge.label}</span>}
      </header>

      <div className="max-h-72 overflow-auto px-4 pb-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b border-slate-100 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">{studentLabel}</th>
              <th scope="col" className="border-b border-slate-100 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">{nowLabel}</th>
              <th scope="col" className="border-b border-slate-100 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-cyan-700">{newLabel}</th>
            </tr>
          </thead>
          <tbody>
            {card.rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-50 last:border-0">
                <td className="py-2 pr-2 text-slate-900">{row.name}</td>
                <td className="py-2 pr-2 tabular-nums text-slate-500">{row.now}</td>
                <td className="py-2">
                  <span className="rounded-md bg-cyan-50 px-1.5 py-0.5 font-semibold tabular-nums text-cyan-800">{row.next}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {card.hiddenCount > 0 && <p className="pt-1.5 text-xs text-slate-500">and {card.hiddenCount} more</p>}
      </div>

      {(card.tally?.length || card.note) && (
        <div className="space-y-2 px-4 pb-3">
          {card.tally && card.tally.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="After saving">
              {card.tally.map((t) => (
                <li key={t.label} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {t.label} <span className="tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
          {card.note && <p className="text-xs leading-relaxed text-slate-500">{card.note}</p>}
        </div>
      )}

      <footer className="border-t border-slate-100 bg-slate-50/70 px-4 py-3" aria-live="polite">
        <Footer entry={entry} onAction={onAction} onAsk={onAsk} streaming={streaming} />
      </footer>
    </section>
  )
}
