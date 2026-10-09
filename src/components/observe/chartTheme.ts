// src/components/observe/chartTheme.ts
// One palette for the console. Colour is semantic: cyan is "the" series,
// rose is errors, amber is warnings, emerald is healthy, violet marks an
// admin preview. Extra categorical series take the ordered list.
export const C = {
  primary: '#22d3ee',
  bad: '#fb7185',
  warn: '#fbbf24',
  good: '#34d399',
  violet: '#a78bfa',
  muted: '#64748b',
  text: '#e2e8f0',
  grid: 'rgba(255,255,255,0.06)',
  series: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#fb923c', '#2dd4bf'],
}

export const axisProps = { tick: { fill: C.muted, fontSize: 11 }, axisLine: false, tickLine: false } as const

export const tooltipProps = {
  contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, color: C.text, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)' },
  labelStyle: { color: '#94a3b8', marginBottom: 4 },
  itemStyle: { color: C.text, padding: 0 },
  cursor: { stroke: 'rgba(255,255,255,0.15)' },
} as const

export const STATUS_COLOR = (status: number) => (status >= 500 ? C.bad : status >= 400 ? C.warn : C.good)
