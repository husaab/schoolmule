// src/app/(user)/observe/alerts/page.tsx
'use client'
// Observe → Alerts: what's firing, whether the alert engine is healthy, every
// incident in the window, and the built-in rules with the owner's settings.
import { useState } from 'react'
import type { AlertRule } from '@/services/types/observe'
import { getAlertIncidents, getAlertRules } from '@/services/observeService'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { useAlertStatus } from '@/hooks/useAlertStatus'
import { useIncidentModal } from '@/hooks/useIncidentModal'
import { useObserveStore } from '@/store/useObserveStore'
import Panel from '@/components/observe/Panel'
import Tile from '@/components/observe/Tile'
import StateBlock from '@/components/observe/StateBlock'
import FiringBanner from '@/components/observe/alerts/FiringBanner'
import IncidentList from '@/components/observe/alerts/IncidentList'
import RuleRow from '@/components/observe/alerts/RuleRow'
import TestAlertButton from '@/components/observe/alerts/TestAlertButton'
import { fmtDateTime, timeAgo } from '@/components/observe/format'

const TIER_GROUPS = [
  { tier: 'critical', title: 'Critical', subtitle: 'Emailed and pushed right away, at any hour' },
  { tier: 'warning', title: 'Warning', subtitle: 'Emailed 7 am–10 pm Toronto time; overnight ones wait for the morning' },
  { tier: 'info', title: 'Notice', subtitle: 'One email, no reminders' },
] as const

export default function AlertsPage() {
  const status = useAlertStatus()
  const statusError = useObserveStore((s) => s.alertStatusError)
  const alertsVersion = useObserveStore((s) => s.alertsVersion)
  const { open } = useIncidentModal()
  const incidentsQ = useObserveQuery(getAlertIncidents, [alertsVersion])
  const rulesQ = useObserveQuery(() => getAlertRules(), [alertsVersion])

  // Saved changes show at once; the next fetch replaces them.
  const [edits, setEdits] = useState<{ basis: AlertRule[] | null; rules: Record<string, AlertRule> }>({ basis: null, rules: {} })
  const overlay = edits.basis === rulesQ.data ? edits.rules : {}
  const rules = (rulesQ.data ?? []).map((r) => overlay[r.id] ?? r)
  const onRuleChange = (rule: AlertRule) => setEdits({ basis: rulesQ.data, rules: { ...overlay, [rule.id]: rule } })

  const db = status?.db
  const lastTick = status?.lastTickAt

  return (
    <div className="space-y-4">
      <FiringBanner incident={status?.firing ?? null} onOpen={open} />

      {statusError && !status && <StateBlock kind="error" message={statusError} />}

      {status && !status.running && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {status.enabled
            ? 'The alert engine is switched on but not running on this server. Check the server logs for "Alerts worker".'
            : 'Alerts are off on this server, so nothing is being watched. They run only where ALERTS_ENABLED=true (production on Railway), never against a local backend.'}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Tile
          label="Alert engine"
          value={!status ? '—' : status.running ? 'Running' : 'Off'}
          tone={!status ? 'neutral' : status.running ? 'good' : 'warn'}
          sub={lastTick ? `checked ${timeAgo(lastTick)}` : status?.running ? 'starting' : undefined}
          loading={!status && !statusError}
        />
        <Tile
          label="Database check"
          value={!db ? '—' : db.ok ? 'Passing' : 'Failing'}
          tone={!db ? 'neutral' : db.ok ? 'good' : 'bad'}
          sub={db && !db.ok ? db.error ?? `${db.consecutiveFails} failures in a row` : 'every 30 s'}
          loading={!status && !statusError}
        />
        <Tile
          label="Emails this hour"
          value={status ? `${status.emailsLastHour} / ${status.emailCap}` : '—'}
          tone={status && status.emailsLastHour >= status.emailCap ? 'warn' : 'neutral'}
          sub="hourly cap"
          loading={!status && !statusError}
        />
        <Tile
          label="Delivered to"
          value={status ? `${status.recipients} inbox${status.recipients === 1 ? '' : 'es'}` : '—'}
          tone={status && status.recipients === 0 ? 'bad' : 'neutral'}
          sub={status ? `${status.pushDevices} phone${status.pushDevices === 1 ? '' : 's'} for push` : undefined}
          loading={!status && !statusError}
        />
        <Tile
          label="Quiet hours"
          value={status ? (status.quietHours ? 'Now' : 'Not now') : '—'}
          tone={status?.quietHours ? 'warn' : 'neutral'}
          sub="10 pm–7 am: warnings wait"
          loading={!status && !statusError}
        />
      </div>

      <Panel
        title="Incidents"
        subtitle={`Opened in the last ${incidentsQ.window}, and anything still open`}
        actions={<TestAlertButton />}
      >
        {incidentsQ.error && !incidentsQ.data ? (
          <StateBlock kind="error" message={incidentsQ.error} onRetry={incidentsQ.refetch} />
        ) : incidentsQ.loading && !incidentsQ.data ? (
          <StateBlock kind="loading" />
        ) : (incidentsQ.data?.incidents.length ?? 0) === 0 ? (
          <StateBlock kind="ok" message={`No incidents in the last ${incidentsQ.window}`} />
        ) : (
          <IncidentList incidents={incidentsQ.data!.incidents} onOpen={open} />
        )}
        {(incidentsQ.data?.otherSends.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Tests and summaries</p>
            <ul className="mt-1.5 space-y-1">
              {incidentsQ.data!.otherSends.slice(0, 8).map((n, i) => (
                <li key={`${n.ts}-${i}`} className="text-xs text-slate-400">
                  <span className="font-mono text-slate-500">{fmtDateTime(n.ts)}</span> · {n.kind === 'test' ? 'Test' : 'Overnight summary'} by {n.channel}
                  {n.ok ? '' : <span className="text-rose-300"> failed{n.error ? `: ${n.error}` : ''}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel
        title="Rules"
        subtitle={status ? `${status.rulesMuted} muted · ${status.rulesWatching} watch-only` : 'Built in; tune, mute or switch off'}
      >
        {rulesQ.error && !rulesQ.data ? (
          <StateBlock kind="error" message={rulesQ.error} onRetry={rulesQ.refetch} />
        ) : rulesQ.loading && !rulesQ.data ? (
          <StateBlock kind="loading" />
        ) : (
          <div className="space-y-5">
            {TIER_GROUPS.map((g) => {
              const list = rules.filter((r) => r.tier === g.tier)
              if (!list.length) return null
              return (
                <section key={g.tier}>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{g.title}</h3>
                  <p className="text-[11px] text-slate-500">{g.subtitle}</p>
                  <ul className="divide-y divide-white/[0.04]">
                    {list.map((r) => <RuleRow key={r.id} rule={r} onChange={onRuleChange} />)}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
