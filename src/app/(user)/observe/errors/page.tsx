// src/app/(user)/observe/errors/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getErrors, getErrorsRange } from '@/services/observeService'
import type { ErrorRangeData } from '@/services/types/observe'
import Panel from '@/components/observe/Panel'
import Sparkline from '@/components/observe/Sparkline'
import StateBlock from '@/components/observe/StateBlock'
import UserChip from '@/components/observe/UserChip'
import CopyButton from '@/components/observe/CopyButton'
import ErrorVolumeChart, { VolumeMode } from '@/components/observe/ErrorVolumeChart'
import { buildSliceReport } from '@/components/observe/errorReport'
import { SourcePill, StatusPill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { bucketToMs, fmtDateTime, fmtTime, timeAgo } from '@/components/observe/format'
import { XMarkIcon } from '@heroicons/react/20/solid'

function SlicePanel({ from, to, onClose }: { from: string; to: string; onClose: () => void }) {
  const [range, setRange] = useState<ErrorRangeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  // Keyed by `from` in the parent, so a new slice remounts with fresh state.
  useEffect(() => {
    let alive = true
    getErrorsRange(from, to)
      .then((r) => alive && setRange(r))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Failed to load'))
    return () => { alive = false }
  }, [from, to])

  return (
    <Panel
      title={`Spike · ${fmtDateTime(from)} → ${fmtTime(to)}`}
      subtitle={range ? `${range.errors.length} errors across ${range.groups.length} groups in this slice` : 'Loading slice…'}
      actions={
        <div className="flex items-center gap-2">
          {range && range.errors.length > 0 && <CopyButton primary label="Copy report for Claude" text={() => buildSliceReport(range)} />}
          <button onClick={onClose} className="rounded-xl border border-white/[0.08] p-1.5 text-slate-400 hover:text-white" title="Close"><XMarkIcon className="h-4 w-4" /></button>
        </div>
      }
      padded={false}
    >
      {error ? <StateBlock kind="error" message={error} /> : !range ? <div className="px-5"><StateBlock kind="loading" /></div> : range.errors.length === 0 ? (
        <StateBlock kind="ok" message="No errors in this slice" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5">
          <ul className="xl:col-span-2 divide-y divide-white/[0.04] border-b xl:border-b-0 xl:border-r border-white/[0.04]">
            {range.groups.map((g) => (
              <li key={g.fingerprint}>
                <Link href={`/observe/errors/${g.fingerprint}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.03]">
                  <span className="font-mono text-lg font-semibold text-rose-300 tabular-nums w-8 text-right shrink-0">{g.count}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-100 truncate">{g.message}</p>
                    <p className="font-mono text-[11px] text-slate-500 truncate">{g.location ?? '—'}</p>
                  </div>
                  <SourcePill source={g.source} />
                </Link>
              </li>
            ))}
          </ul>
          <ul className="xl:col-span-3 divide-y divide-white/[0.04] max-h-[420px] overflow-y-auto">
            {range.errors.map((e, i) => (
              <li key={i}>
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-5 py-2.5 hover:bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500 tabular-nums">{fmtTime(e.ts)}</span>
                    <SourcePill source={e.source} />
                    {e.status !== null && <StatusPill status={e.status} />}
                    {e.requestId && <span className="font-mono text-slate-600 truncate hidden lg:inline">req {e.requestId}</span>}
                    <span className="ml-auto min-w-0"><UserChip user={e.user} compact /></span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1 truncate">{e.message}</p>
                </button>
                {open === i && (
                  e.stack ? (
                    <div className="mx-5 mb-3">
                      <div className="flex justify-end mb-1"><CopyButton label="Copy stack" text={() => e.stack ?? ''} /></div>
                      <pre className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">{e.stack}</pre>
                    </div>
                  ) : <p className="mx-5 mb-3 text-xs text-slate-500">No stack captured for this occurrence.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

export default function ErrorsPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getErrors)
  const [mode, setMode] = useState<VolumeMode>('source')
  const [selected, setSelected] = useState<string | null>(null)
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data
  const groups = data?.groups ?? []
  const total = groups.reduce((n, g) => n + g.count, 0)
  const bucketMs = data ? bucketToMs(data.window.bucket) : 0
  const sliceTo = selected ? new Date(new Date(selected).getTime() + bucketMs).toISOString() : null

  return (
    <div className="space-y-4">
      <Panel
        title="Error volume"
        subtitle={`${total} errors · last ${window} · click a bar to inspect that slice`}
        actions={
          <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.06] p-0.5">
            {(['source', 'group'] as VolumeMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded-[10px] text-xs font-semibold ${mode === m ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                by {m}
              </button>
            ))}
          </div>
        }
      >
        {busy ? <StateBlock kind="loading" /> : total === 0 ? <StateBlock kind="ok" message={`No errors in the last ${window}`} /> : (
          <ErrorVolumeChart series={data?.series ?? []} groups={groups} windowKey={window} mode={mode} selectedTs={selected} onSelect={setSelected} />
        )}
      </Panel>

      {selected && sliceTo && <SlicePanel key={selected} from={selected} to={sliceTo} onClose={() => setSelected(null)} />}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Panel className="xl:col-span-3" title="Error groups" subtitle={`${groups.length} groups · grouped by cause`} padded={false}>
          {busy ? <div className="px-5"><StateBlock kind="loading" /></div> : groups.length === 0 ? <StateBlock kind="ok" message={`No errors in the last ${window}`} /> : (
            <ul className="divide-y divide-white/[0.04]">
              {groups.map((g) => (
                <li key={g.fingerprint}>
                  <Link href={`/observe/errors/${g.fingerprint}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] group">
                    <span className="font-mono text-xl font-semibold text-rose-300 tabular-nums w-12 text-right shrink-0">{g.count}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-100 truncate group-hover:text-white">{g.message}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{g.location ?? '—'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{g.users} {g.users === 1 ? 'user' : 'users'} · first {timeAgo(g.firstSeen)} · last {timeAgo(g.lastSeen)}</p>
                    </div>
                    <div className="w-28 shrink-0 hidden sm:block"><Sparkline data={g.spark} color={C.bad} height={32} /></div>
                    <SourcePill source={g.source} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="xl:col-span-2" title="Recent" subtitle="Latest 100 server and browser errors" padded={false}>
          {busy ? <div className="px-5"><StateBlock kind="loading" /></div> : (
            <ul className="divide-y divide-white/[0.04] max-h-[70vh] overflow-y-auto">
              {(data?.recent ?? []).map((e, i) => (
                <li key={i} className="px-5 py-2.5 text-xs">
                  <Link href={`/observe/errors/${e.fingerprint}`} className="block hover:text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 tabular-nums">{fmtTime(e.ts)}</span>
                      <SourcePill source={e.source} />
                      {e.status !== null && <StatusPill status={e.status} />}
                      <span className="ml-auto min-w-0"><UserChip user={e.user} compact href={false} /></span>
                    </div>
                    <p className="text-slate-200 truncate mt-1">{e.message}</p>
                    <p className="font-mono text-slate-600 truncate">{e.location ?? ''}</p>
                  </Link>
                </li>
              ))}
              {(data?.recent ?? []).length === 0 && <li className="px-5 py-8 text-center text-xs text-slate-500">Nothing in this window</li>}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
