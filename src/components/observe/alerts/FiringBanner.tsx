// src/components/observe/alerts/FiringBanner.tsx
'use client'
// The open incident, across the top of Overview and Alerts. Nothing renders
// when all is clear.
import Link from 'next/link'
import { BellAlertIcon } from '@heroicons/react/24/outline'
import type { AlertIncident } from '@/services/types/observe'
import { fmtDuration, latestRule } from '@/lib/observeAlerts'
import { IncidentStatusPill, TierPill } from '../pills'
import { fmtDateTime } from '../format'

const TONE: Record<string, string> = {
  critical: 'border-rose-400/30 bg-rose-500/10',
  warning: 'border-amber-400/30 bg-amber-500/10',
  info: 'border-sky-400/30 bg-sky-500/10',
}

interface FiringBannerProps {
  incident: AlertIncident | null
  onOpen: (id: string) => void
  /** Show a link to the Alerts page (not on the Alerts page itself). */
  showAlertsLink?: boolean
}

export default function FiringBanner({ incident, onOpen, showAlertsLink = false }: FiringBannerProps) {
  if (!incident) return null
  const latest = latestRule(incident)
  return (
    <div className={`observe-in flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border px-4 py-3 ${TONE[incident.tier] ?? TONE.info}`} role="status">
      <BellAlertIcon className="hidden sm:block h-6 w-6 shrink-0 text-slate-200" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <IncidentStatusPill status={incident.status} held={incident.held} />
          <TierPill tier={incident.tier} />
          <p className="text-sm font-semibold text-white">{incident.title}</p>
        </div>
        <p className="mt-1 text-xs text-slate-300">
          Since {fmtDateTime(incident.openedAt)} · {fmtDuration(incident.durationMs)}
          {incident.rules.length > 1 ? ` · ${incident.rules.length} rules` : ''}
          {latest ? ` · ${latest.summary}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {showAlertsLink && <Link href="/observe/alerts" className="text-xs text-slate-300 hover:text-white underline underline-offset-4">All alerts</Link>}
        <button
          type="button"
          onClick={() => onOpen(incident.id)}
          className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
        >
          Open incident
        </button>
      </div>
    </div>
  )
}
