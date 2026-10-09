// src/app/(user)/observe/infra/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getHealth, getInfra } from '@/services/observeService'
import type { HealthData } from '@/services/types/observe'
import Panel from '@/components/observe/Panel'
import Tile from '@/components/observe/Tile'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import StateBlock from '@/components/observe/StateBlock'
import { DeployPill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtDateTime, fmtGb, fmtNum, timeAgo } from '@/components/observe/format'

const last = (pts?: { value: number }[]) => (pts && pts.length ? pts[pts.length - 1].value : 0)
const peak = (pts?: { value: number }[]) => (pts && pts.length ? Math.max(...pts.map((p) => p.value)) : 0)
const uptime = (s: number) => (s < 3600 ? `${Math.round(s / 60)}m` : s < 86400 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`)

export default function InfraPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getInfra)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [healthErr, setHealthErr] = useState(false)
  useEffect(() => {
    let alive = true
    const tick = () => getHealth().then((h) => alive && (setHealth(h), setHealthErr(false))).catch(() => alive && setHealthErr(true))
    tick()
    const t = setInterval(tick, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data
  const cpu = (data?.cpu ?? []).map((p) => ({ ts: p.ts, value: Math.round(p.value * 1000) / 10 }))
  const mem = (data?.memoryGb ?? []).map((p) => ({ ts: p.ts, value: Math.round(p.value * 1000) / 1000 }))
  const net = (data?.networkRxGb ?? []).map((p, i) => ({ ts: p.ts, rx: Math.round(p.value * 1024 * 100) / 100, tx: Math.round((data?.networkTxGb?.[i]?.value ?? 0) * 1024 * 100) / 100 }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Tile label="API" value={healthErr ? 'down' : health ? (health.ok ? 'healthy' : 'degraded') : '…'} tone={healthErr ? 'bad' : health?.ok ? 'good' : 'warn'} sub={health ? `up ${uptime(health.uptime_s)} · db ${health.db}` : undefined} />
        <Tile label="Event buffer" value={health ? fmtNum(health.buffer.pending) : '…'} sub={health ? `${health.buffer.dropped} dropped · ${health.buffer.failures} failed flushes` : undefined} tone={health && health.buffer.failures > 0 ? 'warn' : 'neutral'} />
        <Tile label="CPU now" value={data?.available ? `${(last(data.cpu) * 100).toFixed(1)}%` : '—'} sub={data?.available ? `peak ${(peak(data.cpu) * 100).toFixed(1)}%` : undefined} spark={cpu.map((p) => p.value)} loading={busy} />
        <Tile label="Memory" value={data?.available ? fmtGb(last(data.memoryGb)) : '—'} sub={data?.available ? `peak ${fmtGb(peak(data.memoryGb))}` : undefined} spark={mem.map((p) => p.value)} loading={busy} />
        <Tile label="Last deploy" value={data?.deployments?.[0] ? timeAgo(data.deployments[0].createdAt) : '—'} sub={data?.deployments?.[0]?.status.toLowerCase()} tone={data?.deployments?.[0]?.status === 'SUCCESS' ? 'good' : data?.deployments?.[0] ? 'warn' : 'neutral'} loading={busy} />
      </div>

      {data && !data.available ? (
        <Panel title="Railway metrics unavailable"><StateBlock kind="error" message={data.reason} /></Panel>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel title="CPU" subtitle={`vCPU % · last ${window}`}>
            {busy ? <StateBlock kind="loading" /> : <TimeSeriesChart data={cpu} windowKey={window} height={200} showLegend={false} leftAxisFormatter={(v) => `${v}%`} series={[{ key: 'value', label: 'cpu %', color: C.primary, kind: 'area' }]} />}
          </Panel>
          <Panel title="Memory" subtitle={`GB · last ${window}`}>
            {busy ? <StateBlock kind="loading" /> : <TimeSeriesChart data={mem} windowKey={window} height={200} showLegend={false} leftAxisFormatter={(v) => `${v}`} series={[{ key: 'value', label: 'GB', color: C.violet, kind: 'area' }]} />}
          </Panel>
          <Panel title="Network" subtitle={`MB per sample · last ${window}`}>
            {busy ? <StateBlock kind="loading" /> : <TimeSeriesChart data={net} windowKey={window} height={200} leftAxisFormatter={(v) => `${v}`} series={[{ key: 'rx', label: 'in', color: C.good, kind: 'line' }, { key: 'tx', label: 'out', color: C.warn, kind: 'line' }]} />}
          </Panel>
          <Panel title="Deployments" subtitle="Latest 10" padded={false}>
            <ul className="divide-y divide-white/[0.04]">
              {(data?.deployments ?? []).map((d) => (
                <li key={d.id} className="px-5 py-2.5 flex items-center gap-3 text-xs">
                  <DeployPill status={d.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 truncate">{d.commitMessage ?? d.id}</p>
                    <p className="text-slate-500 truncate">{[d.commitAuthor, d.branch].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className="font-mono text-slate-500 tabular-nums shrink-0" title={fmtDateTime(d.createdAt)}>{timeAgo(d.createdAt)}</span>
                </li>
              ))}
              {(data?.deployments ?? []).length === 0 && !busy && <li className="px-5 py-8 text-center text-xs text-slate-500">No deployments returned</li>}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  )
}
