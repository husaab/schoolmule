// src/components/observe/Panel.tsx
import { ReactNode } from 'react'

interface PanelProps { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }

export default function Panel({ title, subtitle, actions, children, className = '', padded = true }: PanelProps) {
  return (
    <section className={`observe-in rounded-2xl border border-white/[0.06] bg-slate-900/60 ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? 'px-5 pb-5' : ''}>{children}</div>
    </section>
  )
}
