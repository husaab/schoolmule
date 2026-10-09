// src/app/(user)/observe/features/page.tsx
'use client'
import { useState } from 'react'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getFeatures } from '@/services/observeService'
import Panel from '@/components/observe/Panel'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import BarList from '@/components/observe/BarList'
import StateBlock from '@/components/observe/StateBlock'
import { MethodTag } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtMs, fmtNum, fmtPct } from '@/components/observe/format'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

export default function FeaturesPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getFeatures)
  const [open, setOpen] = useState<string | null>(null)
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data
  const features = data?.features ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Panel className="xl:col-span-3" title="Usage over time" subtitle={`Top ${data?.seriesKeys.length ?? 0} features · last ${window}`}>
          {busy ? <StateBlock kind="loading" /> : (
            <TimeSeriesChart
              data={data?.series ?? []}
              windowKey={window}
              height={280}
              series={(data?.seriesKeys ?? []).map((k, i) => ({ key: k, label: k, color: C.series[i % C.series.length], kind: 'area' as const, stackId: 'f' }))}
            />
          )}
        </Panel>
        <Panel className="xl:col-span-2" title="Most used" subtitle="Requests in window">
          {busy ? <StateBlock kind="loading" /> : (
            <BarList items={features.slice(0, 10).map((f, i) => ({ key: f.feature, label: f.feature, value: f.requests, color: C.series[i % C.series.length], sub: `${f.users} users · ${fmtPct(f.errorRate)} errors` }))} />
          )}
        </Panel>
      </div>

      <Panel title="All features" subtitle="Click a row for its routes" padded={false}>
        {busy ? <div className="px-5"><StateBlock kind="loading" /></div> : (
          <ul className="divide-y divide-white/[0.04]">
            <li className="grid grid-cols-[1fr_80px_70px_80px_80px_24px] gap-2 px-5 py-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              <span>Feature</span><span className="text-right">Requests</span><span className="text-right">Users</span><span className="text-right">Errors</span><span className="text-right">p95</span><span />
            </li>
            {features.map((f) => (
              <li key={f.feature}>
                <button onClick={() => setOpen(open === f.feature ? null : f.feature)} className="w-full grid grid-cols-[1fr_80px_70px_80px_80px_24px] gap-2 px-5 py-2.5 text-sm text-left hover:bg-white/[0.03]">
                  <span className="text-slate-200 truncate">{f.feature}</span>
                  <span className="font-mono text-right tabular-nums text-slate-300">{fmtNum(f.requests)}</span>
                  <span className="font-mono text-right tabular-nums text-slate-400">{f.users}</span>
                  <span className={`font-mono text-right tabular-nums ${f.errors > 0 ? 'text-rose-300' : 'text-slate-500'}`}>{f.errors}{f.errors > 0 && <span className="text-[10px] text-slate-500"> · {fmtPct(f.errorRate)}</span>}</span>
                  <span className="font-mono text-right tabular-nums text-slate-400">{fmtMs(f.p95Ms)}</span>
                  <ChevronRightIcon className={`h-4 w-4 text-slate-600 transition-transform ${open === f.feature ? 'rotate-90' : ''}`} />
                </button>
                {open === f.feature && (
                  <ul className="bg-black/20 border-y border-white/[0.04]">
                    {f.routes.map((r) => (
                      <li key={`${r.method} ${r.route}`} className="grid grid-cols-[1fr_80px_70px_80px_80px_24px] gap-2 px-5 py-1.5 text-xs">
                        <span className="flex items-center gap-2 min-w-0"><MethodTag method={r.method} /><span className="font-mono text-slate-400 truncate">{r.route}</span></span>
                        <span className="font-mono text-right tabular-nums text-slate-300">{fmtNum(r.requests)}</span>
                        <span />
                        <span className={`font-mono text-right tabular-nums ${r.errors > 0 ? 'text-rose-300' : 'text-slate-600'}`}>{r.errors}</span>
                        <span className="font-mono text-right tabular-nums text-slate-500">{fmtMs(r.p95Ms)}</span>
                        <span />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {features.length === 0 && <li className="px-5 py-8 text-center text-xs text-slate-500">Nothing in this window</li>}
          </ul>
        )}
      </Panel>
    </div>
  )
}
