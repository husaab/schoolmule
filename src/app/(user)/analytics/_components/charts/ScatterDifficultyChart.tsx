'use client'

// Assessment difficulty map: X = completion rate, Y = class average.
// Dot size = assessment weight. Quadrants call out "hard & missed" etc.

import React from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts'
import { AssessmentStatsRow } from '@/services/types/analytics'

interface ScatterDifficultyChartProps {
  assessments: AssessmentStatsRow[]
  height?: number
}

interface ScatterPoint {
  name: string
  completion: number
  avg: number
  weight: number
  anomalous: boolean
}

const ScatterDifficultyChart: React.FC<ScatterDifficultyChartProps> = ({
  assessments,
  height = 280,
}) => {
  const points: ScatterPoint[] = assessments
    .filter((a) => a.stats != null)
    .map((a) => ({
      name: a.name,
      completion: Math.round(a.completionRate * 100),
      avg: a.stats!.avg,
      weight: a.weightPoints ?? 10,
      anomalous: a.isAnomalous,
    }))

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No graded assessments yet
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ left: -5, right: 15, top: 10, bottom: 5 }}>
          {/* Quadrant shading: low completion + low avg = trouble corner */}
          <ReferenceArea x1={0} x2={75} y1={0} y2={70} fill="#f43f5e" fillOpacity={0.04} />
          <ReferenceArea x1={75} x2={100} y1={70} y2={100} fill="#10b981" fillOpacity={0.04} />
          <XAxis
            type="number"
            dataKey="completion"
            name="Completion"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Completion rate', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="avg"
            name="Class average"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <ZAxis type="number" dataKey="weight" range={[50, 260]} name="Weight" />
          <ReferenceLine x={75} stroke="#cbd5e1" strokeDasharray="4 4" />
          <ReferenceLine y={70} stroke="#cbd5e1" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as ScatterPoint
              return (
                <div className="bg-white border border-slate-200 rounded-xl shadow-md px-3 py-2 text-xs">
                  <p className="font-semibold text-slate-900 mb-1">{p.name}</p>
                  <p className="text-slate-600">Class avg: {p.avg}%</p>
                  <p className="text-slate-600">Completion: {p.completion}%</p>
                  <p className="text-slate-600">Weight: {p.weight} pts</p>
                  {p.anomalous && <p className="text-rose-600 font-medium mt-1">⚠ Anomalous</p>}
                </div>
              )
            }}
          />
          <Scatter data={points}>
            {points.map((p) => (
              <Cell
                key={p.name}
                fill={p.anomalous ? '#f43f5e' : '#0891b2'}
                fillOpacity={0.75}
                stroke={p.anomalous ? '#be123c' : '#0e7490'}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ScatterDifficultyChart
