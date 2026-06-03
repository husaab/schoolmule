'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface TermComparisonPoint {
  label: string
  current: number | null
  previous?: number | null
}

interface TermComparisonChartProps {
  data: TermComparisonPoint[]
  height?: number
  currentName?: string
  previousName?: string
}

const TermComparisonChart: React.FC<TermComparisonChartProps> = ({
  data,
  height = 260,
  currentName = 'Current term',
  previousName = 'Compare term',
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No data for this selection
      </div>
    )
  }
  const hasPrevious = data.some((d) => d.previous != null)

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }} barGap={4} barCategoryGap="22%">
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'rgba(8,145,178,0.06)' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(v: number, name: string) => [`${v}%`, name]}
          />
          {hasPrevious && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
          <Bar name={currentName} dataKey="current" fill="#0891b2" radius={[6, 6, 0, 0]} maxBarSize={40} />
          {hasPrevious && (
            <Bar name={previousName} dataKey="previous" fill="#5eead4" radius={[6, 6, 0, 0]} maxBarSize={40} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TermComparisonChart
