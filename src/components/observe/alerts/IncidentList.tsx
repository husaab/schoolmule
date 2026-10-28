// src/components/observe/alerts/IncidentList.tsx
// Incidents in the window, the open one first. A row opens the incident modal.
import type { AlertIncident } from '@/services/types/observe'
import { fmtDuration, sortIncidents } from '@/lib/observeAlerts'
import { IncidentStatusPill, TierPill } from '../pills'
import { fmtDateTime, fmtNum } from '../format'

export default function IncidentList({ incidents, onOpen }: { incidents: AlertIncident[]; onOpen: (id: string) => void }) {
  return (
    <ul className="divide-y divide-white/[0.04]">
      {sortIncidents(incidents).map((inc) => (
        <li key={inc.id}>
          <button type="button" onClick={() => onOpen(inc.id)} className="w-full text-left flex items-start gap-3 py-3 group">
            <div className="w-24 shrink-0 pt-0.5 flex flex-col items-start gap-1">
              <IncidentStatusPill status={inc.status} held={inc.held} />
              <TierPill tier={inc.tier} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200 group-hover:text-white truncate">
                {inc.title}
                {inc.reopenCount > 0 && <span className="ml-2 text-[11px] text-amber-300">came back {inc.reopenCount}×</span>}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                {inc.rules.map((r) => r.name).join(' · ')}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 font-mono tabular-nums">
                {fmtDateTime(inc.openedAt)} · {fmtDuration(inc.durationMs)}
                {inc.stats.failedRequests ? ` · ${fmtNum(inc.stats.failedRequests)} failed` : ''}
                {inc.stats.peopleAffected ? ` · ${inc.stats.peopleAffected} people` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right text-[11px] text-slate-500 tabular-nums">
              <p>{inc.emails ?? 0} email{inc.emails === 1 ? '' : 's'}</p>
              <p>{inc.pushes ?? 0} push{inc.pushes === 1 ? '' : 'es'}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
