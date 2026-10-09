// src/app/(user)/observe/errors/[fingerprint]/page.tsx
'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getErrorGroup } from '@/services/observeService'
import Panel from '@/components/observe/Panel'
import Tile from '@/components/observe/Tile'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import StateBlock from '@/components/observe/StateBlock'
import UserChip from '@/components/observe/UserChip'
import { SourcePill, StatusPill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtDateTime, fmtNum, timeAgo } from '@/components/observe/format'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import CopyButton from '@/components/observe/CopyButton'
import { buildGroupReport } from '@/components/observe/errorReport'

export default function ErrorGroupPage({ params }: { params: Promise<{ fingerprint: string }> }) {
  const { fingerprint } = use(params)
  const { data, error, loading, refetch, window } = useObserveQuery((w) => getErrorGroup(fingerprint, w), [fingerprint])
  const [openStack, setOpenStack] = useState<number | null>(0)
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  if (loading && !data) return <StateBlock kind="loading" />
  const d = data!

  return (
    <div className="space-y-4">
      <Link href="/observe/errors" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeftIcon className="h-4 w-4" /> Errors</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1"><SourcePill source={d.group.source} /><span className="font-mono text-[11px] text-slate-500">{d.group.fingerprint}</span></div>
          <h2 className="font-display text-xl font-semibold text-white break-words">{d.group.message}</h2>
          <p className="font-mono text-sm text-slate-400 mt-1">{d.group.location ?? '—'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyButton primary label="Copy report for Claude" copiedLabel="Report copied" text={() => buildGroupReport(d)} />
          {d.group.sampleStack && <CopyButton label="Copy latest stack" text={() => d.group.sampleStack ?? ''} />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Occurrences" value={fmtNum(d.group.count)} tone="bad" spark={d.series.map((p) => p.count)} />
        <Tile label="Affected users" value={fmtNum(d.group.users)} />
        <Tile label="First seen" value={timeAgo(d.group.firstSeen)} sub={fmtDateTime(d.group.firstSeen)} />
        <Tile label="Last seen" value={timeAgo(d.group.lastSeen)} sub={fmtDateTime(d.group.lastSeen)} />
      </div>

      <Panel title="Over time" subtitle={`last ${window}`}>
        <TimeSeriesChart data={d.series as unknown as Record<string, string | number>[]} windowKey={window} height={180} showLegend={false} series={[{ key: 'count', label: 'occurrences', color: C.bad, kind: 'bar' }]} />
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2" title="Occurrences" subtitle="Latest 100 · click to expand the stack" padded={false}>
          <ul className="divide-y divide-white/[0.04] max-h-[60vh] overflow-y-auto">
            {d.occurrences.map((o, i) => (
              <li key={i}>
                <button onClick={() => setOpenStack(openStack === i ? null : i)} className="w-full text-left px-5 py-2.5 hover:bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500 tabular-nums">{fmtDateTime(o.ts)}</span>
                    {o.status !== null && <StatusPill status={o.status} />}
                    {o.requestId && <span className="font-mono text-slate-600 truncate hidden md:inline">req {o.requestId}</span>}
                    <span className="ml-auto min-w-0"><UserChip user={o.user} compact /></span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1 truncate">{o.message}</p>
                </button>
                {openStack === i && !o.stack && <p className="mx-5 mb-3 text-xs text-slate-500">No stack captured for this occurrence.</p>}
                {openStack === i && o.stack && (
                  <div className="mx-5 mb-3">
                    <div className="flex justify-end mb-1"><CopyButton label="Copy stack" text={() => o.stack ?? ''} /></div>
                    <pre className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">{o.stack}</pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Affected users" subtitle="In window">
          <ul className="space-y-2">
            {d.affectedUsers.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-rose-300 tabular-nums w-8 text-right">{a.count}</span>
                <span className="min-w-0 flex-1"><UserChip user={a.user} /></span>
                <span className="text-[11px] text-slate-500 shrink-0">{timeAgo(a.lastSeen)}</span>
              </li>
            ))}
            {d.affectedUsers.length === 0 && <li className="text-xs text-slate-500 text-center py-4">No signed-in users affected</li>}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
