// src/components/observe/Sparkline.tsx
'use client'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { C } from './chartTheme'

export default function Sparkline({ data, color = C.primary, height = 40 }: { data: number[]; color?: string; height?: number }) {
  const points = data.map((v, i) => ({ i, v }))
  const id = `spark-${color.replace('#', '')}`
  return (
    <div style={{ width: '100%', height }} aria-hidden>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
