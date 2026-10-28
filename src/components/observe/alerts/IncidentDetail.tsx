// src/components/observe/alerts/IncidentDetail.tsx
'use client'
// One incident: what tripped, the totals, a timeline of every email and
// push, and the errors behind it. Refreshes while it is still firing.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AlertIncident } from '@/services/types/observe'
import { deleteAlertIncident, getAlertIncident } from '@/services/observeService'
import { isApiError } from '@/services/apiClient'
import { buildTimeline, fmtDuration, TIER_LABEL } from '@/lib/observeAlerts'
import { useObserveStore } from '@/store/useObserveStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { LIVE_INTERVAL_MS } from '@/hooks/useObserveQuery'
import StateBlock from '../StateBlock'
import { IncidentStatusPill, TierPill } from '../pills'
import { fmtDateTime, fmtNum } from '../format'

const DOT: Record<string, string> = {
  opened: 'bg-rose-400',
  tripped: 'bg-amber-400',
  sent: 'bg-slate-400',
  recovered: 'bg-emerald-400',
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-semibold text-white tabular-nums">{value}</p>
    </div>
  )
}

export default function IncidentDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const live = useObserveStore((s) => s.live)
  const bumpAlerts = useObserveStore((s) => s.bumpAlerts)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [incident, setIncident] = useState<AlertIncident | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Bumped to fetch again: Retry, and every 30 s while it is still firing.
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let current = true
    getAlertIncident(id)
      .then((inc) => {
        if (!current) return
        setIncident(inc)
        setError(null)
      })
      .catch((e) => {
        if (!current) return
        if (isApiError(e) && e.status === 404) setNotFound(true)
        else setError(e instanceof Error ? e.message : 'Could not load the incident')
      })
    return () => {
      current = false
    }
  }, [id, tick])

  const firing = incident?.status === 'open'
  useEffect(() => {
    if (!live || !firing) return
    const t = setInterval(() => setTick((n) => n + 1), LIVE_INTERVAL_MS)
    return () => clearInterval(t)
  }, [live, firing])

  const remove = async () => {
    setDeleting(true)
    try {
      await deleteAlertIncident(id)
      showNotification('Incident deleted', 'success')
      bumpAlerts()
      onClose()
    } catch (e) {
      showNotification(e instanceof Error ? e.message : 'Could not delete the incident', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (notFound) return <StateBlock kind="empty" message="This incident no longer exists. It may have been deleted." />
  if (error && !incident) return <StateBlock kind="error" message={error} onRetry={() => setTick((n) => n + 1)} />
  if (!incident) return <StateBlock kind="loading" />

  const timeline = buildTimeline(incident)
  const s = incident.stats

  return (
    <div className="space-y-6">
      <header className="pr-10">
        <div className="flex flex-wrap items-center gap-2">
          <IncidentStatusPill status={incident.status} held={incident.held} />
          <TierPill tier={incident.tier} />
          {incident.reopenCount > 0 && <span className="text-[11px] text-amber-300">came back {incident.reopenCount}×</span>}
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">{incident.title}</h2>
        <p className="mt-1 text-xs text-slate-400">
          {TIER_LABEL[incident.tier]} · opened {fmtDateTime(incident.openedAt)}
          {incident.resolvedAt ? ` · recovered ${fmtDateTime(incident.resolvedAt)}` : ' · still open'}
          {incident.held ? ' · emails wait until 7 am (quiet hours)' : ''}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Figure label={incident.resolvedAt ? 'Lasted' : 'Open for'} value={fmtDuration(incident.durationMs)} />
        <Figure label="Failed responses" value={fmtNum(s.failedRequests)} />
        <Figure label="People affected" value={fmtNum(s.peopleAffected)} />
        <Figure label="Worst 5 minutes" value={`${fmtNum(s.peakErrors5m)} errors`} />
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">What tripped</h3>
        <ul className="mt-2 divide-y divide-white/[0.04]">
          {incident.rules.map((r) => (
            <li key={r.id} className="py-2.5 flex items-start gap-3">
              <TierPill tier={r.tier} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">{r.name}</p>
                <p className="text-xs text-slate-400">{r.summary}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                  first {fmtDateTime(r.firstAt)} · last {fmtDateTime(r.lastAt)} · peak {fmtNum(r.peak)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Timeline</h3>
        <ol className="mt-3 border-l border-white/[0.08] ml-1.5 space-y-3">
          {timeline.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative pl-4">
              <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${e.ok === false ? 'bg-rose-500' : DOT[e.kind]}`} />
              <p className={`text-sm ${e.ok === false ? 'text-rose-300' : 'text-slate-200'}`}>{e.label}</p>
              <p className="text-[11px] text-slate-500 font-mono">{fmtDateTime(e.at)}{e.detail ? ` · ${e.detail}` : ''}</p>
            </li>
          ))}
          {firing && (
            <li className="relative pl-4">
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-400 observe-live-dot" />
              <p className="text-sm text-rose-300">Still open</p>
              <p className="text-[11px] text-slate-500">Reminders every hour; a recovery email after 15 quiet minutes.</p>
            </li>
          )}
        </ol>
      </section>

      {s.topErrors.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Top errors</h3>
          <ul className="mt-2 divide-y divide-white/[0.04]">
            {s.topErrors.map((e) => (
              <li key={e.fingerprint}>
                <Link href={`/observe/errors/${e.fingerprint}`} className="flex items-center gap-3 py-2 group">
                  <span className="font-mono text-base font-semibold text-rose-300 tabular-nums w-10 text-right shrink-0">{e.count}</span>
                  <p className="min-w-0 flex-1 text-sm text-slate-300 group-hover:text-white truncate">{e.message}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {incident.status === 'resolved' && (
        <footer className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
          {confirmDelete ? (
            <>
              <span className="text-xs text-slate-400">Delete this incident and its send history?</span>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-slate-300 hover:text-white">Keep</button>
              <button type="button" onClick={remove} disabled={deleting} className="rounded-xl bg-rose-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-slate-400 hover:text-rose-300">Delete incident</button>
          )}
        </footer>
      )}
    </div>
  )
}
