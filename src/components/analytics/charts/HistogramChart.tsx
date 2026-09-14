'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { HistogramBucket } from '@/services/types/analytics'

// Performance band colors: rose (<60) → amber → blue → teal → emerald (90+)
function colorForBucket(min: number): string {
  if (min >= 90) return '#10b981' // emerald-500
  if (min >= 80) return '#14b8a6' // teal-500
  if (min >= 70) return '#3b82f6' // blue-500
  if (min >= 60) return '#f59e0b' // amber-500
  return '#f43f5e' // rose-500
}

interface HistogramChartProps {
  data: HistogramBucket[]
  height?: number
  /** Hide empty leading buckets (0-9, 10-19…) to focus the x-axis. */
  trimLeadingEmpty?: boolean
}

const HistogramChart: React.FC<HistogramChartProps> = ({
  data,
  height = 240,
  trimLeadingEmpty = true,
}) => {
  let buckets = data
  if (trimLeadingEmpty) {
    const firstNonEmpty = data.findIndex((b) => b.count > 0)
    if (firstNonEmpty > 0) buckets = data.slice(Math.min(firstNonEmpty, 5))
  }

  const total = buckets.reduce((s, b) => s + b.count, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No grade data for this selection
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={buckets} margin={{ left: 0, right: 10, top: 18, bottom: 0 }}>
          <XAxis
            dataKey="bucket"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip
            cursor={{ fill: 'rgba(8,145,178,0.06)' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(v: number) => [`${v} student${v === 1 ? '' : 's'}`, 'Count']}
            labelFormatter={(label) => `${label}%`}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#94a3b8' }} />
            {buckets.map((b) => (
              <Cell key={b.bucket} fill={colorForBucket(b.min)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HistogramChart
