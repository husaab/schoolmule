// src/components/observe/TimeSeriesChart.tsx
'use client'
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WindowKey } from '@/services/types/observe'
import { axisProps, tooltipProps, C } from './chartTheme'
import { fmtDateTime, fmtNum, tickFormatterFor } from './format'

export interface SeriesDef { key: string; label: string; color: string; kind?: 'area' | 'line' | 'bar'; stackId?: string; yAxisId?: 'left' | 'right' }

interface Props {
  data: Record<string, string | number>[]
  series: SeriesDef[]
  windowKey: WindowKey
  height?: number
  rightAxisFormatter?: (v: number) => string
  leftAxisFormatter?: (v: number) => string
  showLegend?: boolean
}

export default function TimeSeriesChart({ data, series, windowKey, height = 240, rightAxisFormatter, leftAxisFormatter = fmtNum, showLegend = true }: Props) {
  const tick = tickFormatterFor(windowKey)
  const hasRight = series.some((s) => s.yAxisId === 'right')
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 0 : 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="ts" tickFormatter={tick} minTickGap={32} {...axisProps} />
          <YAxis yAxisId="left" allowDecimals={false} tickFormatter={leftAxisFormatter} width={48} {...axisProps} />
          {hasRight && <YAxis yAxisId="right" orientation="right" tickFormatter={rightAxisFormatter} width={48} {...axisProps} />}
          <Tooltip {...tooltipProps} labelFormatter={(v) => fmtDateTime(String(v))} formatter={(v, name) => [typeof v === 'number' ? (name === 'p95' ? `${v} ms` : fmtNum(v)) : v, name]} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
          {series.map((s) =>
            s.kind === 'line' ? (
              <Line key={s.key} yAxisId={s.yAxisId ?? 'left'} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
            ) : s.kind === 'bar' ? (
              <Bar key={s.key} yAxisId={s.yAxisId ?? 'left'} dataKey={s.key} name={s.label} fill={s.color} stackId={s.stackId} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            ) : (
              <Area key={s.key} yAxisId={s.yAxisId ?? 'left'} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={1.75} fill={`url(#g-${s.key})`} stackId={s.stackId} dot={false} isAnimationActive={false} />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
