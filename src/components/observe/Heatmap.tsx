// src/components/observe/Heatmap.tsx
// Weekday × hour grid in Toronto time. Opacity encodes volume on one hue.
import { DOW } from './format'

export default function Heatmap({ cells }: { cells: { dow: number; hour: number; requests: number }[] }) {
  const grid = new Map<string, number>()
  let max = 0
  for (const c of cells) {
    grid.set(`${c.dow}-${c.hour}`, c.requests)
    max = Math.max(max, c.requests)
  }
  if (max === 0) return <p className="text-xs text-slate-500 py-6 text-center">Nothing in this window</p>
  const order = [1, 2, 3, 4, 5, 6, 0]
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: '40px repeat(24, minmax(0, 1fr))', gap: 3 }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[9px] text-slate-500 text-center tabular-nums">{h % 3 === 0 ? `${h}`.padStart(2, '0') : ''}</div>
          ))}
          {order.map((d) => (
            <div key={d} className="contents">
              <div className="text-[10px] text-slate-500 flex items-center">{DOW[d]}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const v = grid.get(`${d}-${h}`) ?? 0
                const a = v === 0 ? 0.04 : 0.15 + 0.85 * Math.sqrt(v / max)
                return (
                  <div
                    key={h}
                    title={`${DOW[d]} ${`${h}`.padStart(2, '0')}:00 — ${v} requests`}
                    className="h-5 rounded-[4px]"
                    style={{ background: v === 0 ? 'rgba(255,255,255,0.04)' : `rgba(34,211,238,${a.toFixed(2)})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
