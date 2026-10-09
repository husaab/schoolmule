// src/components/observe/BarList.tsx
import Link from 'next/link'
import { ReactNode } from 'react'
import { fmtNum } from './format'

export interface BarItem { label: ReactNode; value: number; sub?: ReactNode; href?: string; color?: string; key?: string }

export default function BarList({ items, valueFormatter = fmtNum, color = '#22d3ee' }: { items: BarItem[]; valueFormatter?: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <p className="text-xs text-slate-500 py-4 text-center">Nothing in this window</p>
  return (
    <ul className="space-y-2">
      {items.map((it, i) => {
        const row = (
          <div className="group">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-slate-200 group-hover:text-white">{it.label}</span>
              <span className="font-mono text-xs text-slate-300 tabular-nums shrink-0">{valueFormatter(it.value)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(it.value / max) * 100}%`, background: it.color ?? color }} />
            </div>
            {it.sub && <div className="mt-0.5 text-[11px] text-slate-500">{it.sub}</div>}
          </div>
        )
        return <li key={it.key ?? i}>{it.href ? <Link href={it.href}>{row}</Link> : row}</li>
      })}
    </ul>
  )
}
