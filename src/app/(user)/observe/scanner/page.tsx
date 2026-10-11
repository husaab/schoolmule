// src/app/(user)/observe/scanner/page.tsx
'use client'
// Who is polling what. Routes ranked by volume with the cadence of each
// user's own requests: a steady median gap is a timer, a big share of gaps
// under 2 s is a duplicate fetch. Suspects are one user hammering one route.
import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getScanner, getScannerSeries, getUsers } from '@/services/observeService'
import type { ObserveUserRow, ScannerCadence, ScannerRoute, ScannerSuspect } from '@/services/types/observe'
import Panel from '@/components/observe/Panel'
import Tile from '@/components/observe/Tile'
import DataTable, { Column } from '@/components/observe/DataTable'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import StateBlock from '@/components/observe/StateBlock'
import UserChip from '@/components/observe/UserChip'
import { MethodTag, PatternPill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtGap, fmtMs, fmtNum, fmtPct, perHour, windowHours } from '@/components/observe/format'

interface Selection { method: string; route: string; userId: string | null }
const routeKey = (r: { method: string; route: string }) => `${r.method} ${r.route}`
const sameRoute = (a: { method: string; route: string } | null, b: { method: string; route: string }) => !!a && routeKey(a) === routeKey(b)

const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="font-mono text-slate-100 tabular-nums">{children}</p></div>
)
const RouteCell = ({ method, route }: { method: string; route: string }) => (
  <span className="flex items-center gap-2 min-w-0"><MethodTag method={method} /><span className="font-mono text-slate-200 truncate" title={route}>{route}</span></span>
)
const burstTone = (share: number) => (share >= 0.3 ? 'text-rose-300' : share >= 0.1 ? 'text-amber-300' : 'text-slate-500')

// Columns both tables share. Hours come from the API window so per-hour matches the counts.
function cadenceColumns<T extends ScannerCadence & { requests: number; status304Share: number }>(hours: number): Column<T>[] {
  return [
    { key: 'requests', header: 'Requests', align: 'right', sortValue: (r) => r.requests, render: (r) => <span className="font-mono tabular-nums text-slate-100">{fmtNum(r.requests)}</span> },
    { key: 'perHour', header: 'Per hour', align: 'right', sortValue: (r) => r.requests / hours, render: (r) => <span className="font-mono tabular-nums text-slate-300">{perHour(r.requests, hours)}</span> },
    { key: 'gap', header: 'Median gap', align: 'right', sortValue: (r) => r.medianGapS, render: (r) => <span className="font-mono tabular-nums text-slate-300">{fmtGap(r.medianGapS)}</span> },
    { key: 'burst', header: 'Bursts', align: 'right', sortValue: (r) => r.burstShare, render: (r) => <span className={`font-mono tabular-nums ${burstTone(r.burstShare)}`}>{fmtPct(r.burstShare, 0)}</span> },
    { key: 's304', header: '304', align: 'right', sortValue: (r) => r.status304Share, render: (r) => <span className="font-mono tabular-nums text-slate-400">{fmtPct(r.status304Share, 0)}</span> },
  ]
}

function RouteSeries({ selection, hours }: { selection: Selection; hours: number }) {
  const { userId, method, route } = selection
  const { data, error, loading, refetch, window } = useObserveQuery((w) => getScannerSeries(w, userId, method, route), [userId, method, route])
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  if (loading && !data) return <StateBlock kind="loading" />
  const d = data!
  const total = d.series.reduce((n, p) => n + p.requests, 0)
  const peak = d.series.reduce((m, p) => (p.requests > m ? p.requests : m), 0)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Requests">{fmtNum(total)}</Stat>
        <Stat label="Per hour">{perHour(total, hours)}</Stat>
        <Stat label={`Peak / ${d.bucket.replace('utes', '').replace('ute', '')}`}>{peak}</Stat>
      </div>
      <TimeSeriesChart data={d.series} windowKey={window} height={160} showLegend={false} series={[{ key: 'requests', label: 'requests', color: C.primary, kind: 'area' }]} />
      <p className="text-[11px] text-slate-500">Requests per {d.bucket}{userId ? ' · one user' : ' · all users'}</p>
    </div>
  )
}

function ScannerPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [userId, setUserId] = useState<string | null>(() => params.get('user') || null)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [users, setUsers] = useState<ObserveUserRow[]>([])

  const { data, error, loading, refetch, window } = useObserveQuery((w) => getScanner(w, userId), [userId])

  // Account names for the picker: one fetch, the list is the same in any window.
  useEffect(() => {
    let cancelled = false
    getUsers('24h').then((d) => { if (!cancelled) setUsers([...d.users].sort((a, b) => a.name.localeCompare(b.name))) }).catch(() => { /* picker falls back to the raw id */ })
    return () => { cancelled = true }
  }, [])

  const chooseUser = (id: string | null) => {
    setUserId(id)
    setSelected(null)
    const next = new URLSearchParams(params.toString())
    if (id) next.set('user', id)
    else next.delete('user')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data
  const hours = data ? windowHours(data.window.from, data.window.to) : 24
  const th = data?.thresholds
  const routes = data?.routes ?? []
  const selectedRow = selected ? routes.find((r) => sameRoute(selected, r)) ?? null : null
  const filteredUser = userId ? users.find((u) => u.id === userId) ?? null : null

  const suspectColumns: Column<ScannerSuspect>[] = [
    { key: 'user', header: 'User', sortValue: (s) => s.user?.name ?? null, render: (s) => <UserChip user={s.user} /> },
    { key: 'route', header: 'Route', sortValue: (s) => s.route, render: (s) => <RouteCell method={s.method} route={s.route} /> },
    ...cadenceColumns<ScannerSuspect>(hours),
  ]
  const routeColumns: Column<ScannerRoute>[] = [
    { key: 'route', header: 'Route', sortValue: (r) => r.route, render: (r) => <RouteCell method={r.method} route={r.route} /> },
    { key: 'pattern', header: 'Pattern', sortValue: (r) => r.pattern ?? 'zz', render: (r) => <PatternPill pattern={r.pattern} /> },
    ...cadenceColumns<ScannerRoute>(hours),
    { key: 'users', header: 'Users', align: 'right', sortValue: (r) => r.users, render: (r) => <span className="font-mono tabular-nums text-slate-400">{r.users}</span> },
    { key: 'p95', header: 'p95', align: 'right', sortValue: (r) => r.p95Ms, render: (r) => <span className="font-mono tabular-nums text-slate-400">{fmtMs(r.p95Ms)}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Gaps are measured between consecutive requests from the <span className="text-slate-300">same user</span> to the same route.
          A steady gap is a timer; many gaps under {th?.burstGapS ?? 2} s are duplicate fetches.
        </p>
        <div className="flex items-center gap-2">
          {userId && <button onClick={() => chooseUser(null)} className="text-xs text-slate-400 hover:text-white underline underline-offset-4">clear</button>}
          <select
            value={userId ?? ''}
            onChange={(e) => chooseUser(e.target.value || null)}
            aria-label="Filter by user"
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40 max-w-[280px]"
          >
            <option value="">All users</option>
            {userId && !filteredUser && <option value={userId}>{userId}</option>}
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role.toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label={`Signed-in requests (${window})`} value={fmtNum(data?.totals.requests ?? 0)} sub={data ? `${perHour(data.totals.requests, hours)} / hour` : undefined} loading={busy} />
        <Tile label="Users" value={fmtNum(data?.totals.users ?? 0)} loading={busy} />
        <Tile label="Routes" value={fmtNum(data?.totals.routes ?? 0)} loading={busy} />
        <Tile label="Polling suspects" value={fmtNum(data?.suspects.length ?? 0)} tone={(data?.suspects.length ?? 0) > 0 ? 'bad' : 'good'} sub={th ? `> ${th.suspectMinRequests} req · gap < ${th.suspectMaxMedianGapS} s` : undefined} loading={busy} />
      </div>

      <Panel title="Polling suspects" subtitle={th ? `One user, more than ${th.suspectMinRequests} requests to one route in the window, median gap under ${th.suspectMaxMedianGapS} s · click for that user's timeline` : undefined}>
        {busy ? <StateBlock kind="loading" /> : (
          <DataTable
            columns={suspectColumns}
            rows={data?.suspects ?? []}
            rowKey={(s) => `${s.user?.id ?? 'anon'} ${routeKey(s)}`}
            onRowClick={(s) => setSelected({ method: s.method, route: s.route, userId: s.user?.id ?? userId })}
            rowClassName={(s) => (selected && sameRoute(selected, s) && selected.userId === (s.user?.id ?? userId) ? 'bg-cyan-400/[0.06]' : '')}
            initialSort={{ key: 'requests', dir: 'desc' }}
            empty="No one is polling hard enough to flag"
            dense
          />
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Panel className="xl:col-span-3" title="Routes" subtitle={`${filteredUser ? filteredUser.name : userId ? 'One user' : 'All users'} · click a row for its timeline`}>
          {busy ? <StateBlock kind="loading" /> : (
            <DataTable
              columns={routeColumns}
              rows={routes}
              rowKey={routeKey}
              onRowClick={(r) => setSelected(selected && sameRoute(selected, r) && selected.userId === userId ? null : { method: r.method, route: r.route, userId })}
              rowClassName={(r) => (selected && sameRoute(selected, r) && selected.userId === userId ? 'bg-cyan-400/[0.06]' : '')}
              initialSort={{ key: 'requests', dir: 'desc' }}
              empty="Nothing in this window"
              dense
              maxHeight="calc(100dvh - 420px)"
            />
          )}
        </Panel>
        <Panel className="xl:col-span-2" title="Timeline" subtitle={selected ? `${selected.method} ${selected.route}${selected.userId && selected.userId !== userId ? ' · one user' : ''}` : 'Select a route'}>
          {selected ? (
            <div className="space-y-4">
              {selectedRow && selected.userId === userId && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Median gap">{fmtGap(selectedRow.medianGapS)}</Stat>
                  <Stat label={`Bursts (< ${th?.burstGapS ?? 2} s)`}>{fmtPct(selectedRow.burstShare, 0)} <span className="text-slate-500">of {selectedRow.gaps} gaps</span></Stat>
                  <Stat label="304 share">{fmtPct(selectedRow.status304Share, 0)}</Stat>
                  <Stat label="Users · p95">{selectedRow.users} · {fmtMs(selectedRow.p95Ms)}</Stat>
                </div>
              )}
              <RouteSeries key={`${selected.userId ?? 'all'} ${routeKey(selected)}`} selection={selected} hours={hours} />
            </div>
          ) : (
            <StateBlock kind="empty" message="Pick a route or a suspect to see its timeline" />
          )}
        </Panel>
      </div>
    </div>
  )
}

export default function ScannerPageBoundary() {
  return (
    <Suspense fallback={<StateBlock kind="loading" />}>
      <ScannerPage />
    </Suspense>
  )
}
