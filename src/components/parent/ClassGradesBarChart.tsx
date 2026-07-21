'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { ChildClassGrades } from '@/services/types/parentPortal'

// Grade-band status colors, validated against the light surface
// (dataviz six-checks: lightness band, CVD separation, normal-vision floor).
// Color reinforces the band; the % label on every bar carries the value.
const bandColor = (pct: number) => (pct >= 80 ? '#059669' : pct >= 60 ? '#f59e0b' : '#f43f5e')

const truncate = (s: string, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

type Row = { subject: string; pct: number; classAvg: number | null; teacher: string | null }

const ChartTooltip: React.FC<{
  active?: boolean
  payload?: { payload: Row }[]
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-md px-3.5 py-2.5">
      <p className="text-sm font-semibold text-slate-900">{row.subject}</p>
      {row.teacher && <p className="text-xs text-slate-400 mb-1">{row.teacher}</p>}
      <p className="text-xs text-slate-600">
        Grade: <span className="font-semibold">{row.pct}%</span>
      </p>
      {row.classAvg != null && (
        <p className="text-xs text-slate-500">Class average: {row.classAvg}%</p>
      )}
    </div>
  )
}

/**
 * Horizontal bar chart of a child's current grade in each class.
 * One bar per class, colored by grade band (>=80 / 60-79 / <60).
 */
const ClassGradesBarChart: React.FC<{ classes: ChildClassGrades[] }> = ({ classes }) => {
  const data: Row[] = classes
    .filter((c) => c.finalPct != null)
    .map((c) => ({
      subject: c.subject,
      pct: c.finalPct as number,
      classAvg: c.classAvg,
      teacher: c.teacherName,
    }))

  if (data.length < 2) return null

  const height = data.length * 34 + 30

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-5">
      <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
        Grades by Class
      </h4>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 42, bottom: 0, left: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="subject"
              width={138}
              tickFormatter={(v: string) => truncate(v)}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#fafaf9' }} />
            <Bar dataKey="pct" barSize={14} radius={[0, 4, 4, 0]} background={{ fill: '#f5f5f4', radius: 4 }}>
              {data.map((row) => (
                <Cell key={row.subject} fill={bandColor(row.pct)} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(label: React.ReactNode) => `${label}%`}
                style={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ClassGradesBarChart
