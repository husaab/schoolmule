'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export interface TrendSeriesPoint {
  label: string
  value: number | null
  /** Optional second series (e.g. compare term). */
  compare?: number | null
}

interface TrendLineChartProps {
  data: TrendSeriesPoint[]
  height?: number
  seriesName?: string
  compareName?: string
  /** Draw a horizontal reference (e.g. class average). */
  referenceValue?: number | null
  referenceLabel?: string
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  height = 260,
  seriesName = 'Average',
  compareName = 'Compare',
  referenceValue,
  referenceLabel,
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        Not enough dated data for a trend
      </div>
    )
  }
  const hasCompare = data.some((d) => d.compare != null)

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 16, right: 16 }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(v: number, name: string) => [`${v}%`, name]}
            labelStyle={{ color: '#1e293b', fontWeight: 600 }}
          />
          {referenceValue != null && (
            <ReferenceLine
              y={referenceValue}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: referenceLabel || `${referenceValue}%`,
                position: 'right',
                fill: '#94a3b8',
                fontSize: 10,
              }}
            />
          )}
          <Line
            type="monotone"
            name={seriesName}
            dataKey="value"
            stroke="#0891b2"
            strokeWidth={2.5}
            connectNulls
            dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
          />
          {hasCompare && (
            <Line
              type="monotone"
              name={compareName}
              dataKey="compare"
              stroke="#0d9488"
              strokeWidth={2}
              strokeDasharray="6 3"
              connectNulls
              dot={{ r: 3, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendLineChart
