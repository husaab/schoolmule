// File: src/app/(user)/classes/[classId]/edit/_components/SectionNav.tsx
'use client'

import React from 'react'

export interface SectionNavItem {
  id: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

interface SectionNavProps {
  sections: SectionNavItem[]
  activeId: string | null
  onNavigate: (id: string) => void
  variant: 'desktop' | 'mobile'
}

/**
 * In-page "On this page" navigator. Desktop: sticky vertical rail beside the
 * content. Mobile: sticky horizontal chip bar under the navbar. Items are
 * buttons (not anchors) so the JS-driven offset scroll isn't fought by the
 * browser's native hash jump.
 */
const SectionNav: React.FC<SectionNavProps> = ({ sections, activeId, onNavigate, variant }) => {
  if (variant === 'mobile') {
    return (
      <div className="lg:hidden sticky top-20 z-10 -mx-6 px-6 py-2 bg-slate-50/95 backdrop-blur border-b border-slate-100 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                activeId === id
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <nav className="hidden lg:block w-56 shrink-0 sticky top-28 self-start">
      <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        On this page
      </p>
      <ul className="space-y-1">
        {sections.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                activeId === id
                  ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 font-medium border border-cyan-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default SectionNav
