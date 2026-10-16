// src/components/classes/page/TabEmptyState.tsx
// The quiet card a class tab shows while it has nothing in it.

import type { ComponentType, ReactNode, SVGProps } from 'react'

interface TabEmptyStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}

export default function TabEmptyState({ icon: Icon, children }: TabEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-[15px] text-slate-600">{children}</p>
    </div>
  )
}
