'use client'
// The Datadog-style error chart: one bar per bucket, stacked by source or by
// the top error groups. Clicking a bar selects that slice for drill-down.
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ErrorGroup, ErrorSeriesPoint, WindowKey } from '@/services/types/observe'
import { axisProps, tooltipProps, C } from './chartTheme'
import { fmtDateTime, tickFormatterFor } from './format'

export type VolumeMode = 'source' | 'group'

interface Props {
  series: ErrorSeriesPoint[]
  groups: (ErrorGroup & { spark: number[] })[]
  windowKey: WindowKey
  mode: VolumeMode
  selectedTs: string | null
  onSelect: (ts: string | null) => void
  height?: number
}

const PINK = '#f472b6'
const short = (m: string) => (m.length > 28 ? m.slice(0, 27) + '…' : m)

export default function ErrorVolumeChart({ series, groups, windowKey, mode, selectedTs, onSelect, height = 220 }: Props) {
  const tick = tickFormatterFor(windowKey)
  const top = groups.slice(0, 5)
  const data = series.map((p, i) => {
    const row: Record<string, string | number> = { ts: p.ts, server: p.server, client: p.client, total: p.server + p.client }
    for (const g of top) row[g.fingerprint] = g.spark[i] ?? 0
    return row
  })
  const bars = mode === 'source'
    ? [{ key: 'server', label: 'server', color: C.bad }, { key: 'client', label: 'browser', color: PINK }]
    : top.map((g, i) => ({ key: g.fingerprint, label: short(g.message), color: C.series[i % C.series.length] }))

  return (
    <div style={{ width: '100%', height }} className="cursor-pointer">
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          onClick={(state) => {
            const label = state && (state as { activeLabel?: string | number }).activeLabel
            if (typeof label === 'string') onSelect(label === selectedTs ? null : label)
          }}
        >
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="ts" tickFormatter={tick} minTickGap={32} {...axisProps} />
          <YAxis allowDecimals={false} width={40} {...axisProps} />
          <Tooltip {...tooltipProps} labelFormatter={(v) => `${fmtDateTime(String(v))} · click to inspect`} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.label} stackId="e" fill={b.color} isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {data.map((row) => (
                <Cell key={String(row.ts)} fillOpacity={selectedTs && row.ts !== selectedTs ? 0.3 : 1} stroke={row.ts === selectedTs ? '#fff' : undefined} strokeWidth={row.ts === selectedTs ? 1 : 0} />
              ))}
            </Bar>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
