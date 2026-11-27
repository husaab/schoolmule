'use client'
// Admin Panel → Muley activity: every change prepared through Muley at the
// school, newest first. Who asked for it, who saved or undid it, and each
// student's value before and after. Full administrators only; nothing here
// changes anything (Undo stays on the card in the person's own conversation).

import { useCallback, useEffect, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import MuleyAvatar from '@/components/muley/MuleyAvatar'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { getMuleyLog } from '@/services/muleyService'
import { LOG_FILTERS, LOG_STATUS, logTimeline, type LogTone, type MuleyLogEntry } from '@/lib/muley/log'

const TONE: Record<LogTone, string> = {
  good: 'bg-teal-100 text-teal-800',
  info: 'bg-cyan-100 text-cyan-800',
  warn: 'bg-amber-100 text-amber-800',
  muted: 'bg-slate-100 text-slate-600',
}

function Entry({ entry }: { entry: MuleyLogEntry }) {
  const [open, setOpen] = useState(false)
  const status = LOG_STATUS[entry.status] || { label: entry.status, tone: 'muted' as const }
  const [first, ...rest] = logTimeline(entry)
  return (
    <li className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 shrink-0 rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-800">{entry.kindLabel}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{entry.title}</p>
          <p className="text-sm text-slate-500">{first}</p>
          {rest.map((line) => <p key={line} className="text-sm text-slate-500">{line}</p>)}
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TONE[status.tone]}`}>{status.label}</span>
      </div>
      {entry.changes.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50/60"
          >
            {open ? 'Hide what changed' : `What changed (${entry.changes.length})`}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {open && (
            <div className="overflow-x-auto px-4 pb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="py-1.5 pr-2">Student or item</th>
                    <th scope="col" className="py-1.5 pr-2">Before</th>
                    <th scope="col" className="py-1.5">After</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.changes.map((c, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="py-1.5 pr-2 text-slate-900">{c.name}</td>
                      <td className="py-1.5 pr-2 tabular-nums text-slate-500">{c.now ?? '—'}</td>
                      <td className="py-1.5 tabular-nums font-medium text-cyan-800">{c.next ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function MuleyActivityPage() {
  const [filter, setFilter] = useState('all')
  const [entries, setEntries] = useState<MuleyLogEntry[] | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [more, setMore] = useState(false)
  const status = LOG_FILTERS.find((f) => f.key === filter)?.status ?? null

  const load = useCallback(async () => {
    setEntries(null)
    setError(null)
    try {
      const page = await getMuleyLog({ status })
      setEntries(page.entries)
      setNext(page.next)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Muley's activity couldn't be loaded")
    }
  }, [status])
  useEffect(() => {
    void load()
  }, [load])

  const loadMore = async () => {
    if (!next) return
    setMore(true)
    try {
      const page = await getMuleyLog({ status, before: next })
      setEntries((list) => [...(list || []), ...page.entries])
      setNext(page.next)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Muley's activity couldn't be loaded")
    } finally {
      setMore(false)
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl p-6 lg:p-8">
          <div className="mb-6 flex items-start gap-4">
            <MuleyAvatar size={52} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">Muley activity</h1>
              <p className="mt-1 max-w-[62ch] text-slate-500">
                Every change Muley prepared at your school: who asked for it, who saved or undid it, and what it changed. Muley never saves anything itself; a person presses Save.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Show">
            {LOG_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.key ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}{' '}
              <button type="button" onClick={() => void load()} className="cursor-pointer font-medium underline underline-offset-2">Try again</button>
            </div>
          )}

          {entries === null && !error ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : entries && entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="font-medium text-slate-800">Nothing here yet</p>
              <p className="mt-1 text-sm text-slate-500">
                {filter === 'all' ? 'When someone asks Muley to take attendance, enter marks or change a school image, it shows here.' : 'No changes with this status.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {(entries || []).map((entry) => <Entry key={entry.id} entry={entry} />)}
            </ul>
          )}

          {next && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => void loadMore()} disabled={more} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                {more ? 'Loading…' : 'Show older'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
