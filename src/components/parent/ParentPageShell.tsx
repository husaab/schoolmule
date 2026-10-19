'use client'

import React from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ParentBottomNav from '@/components/parent/ParentBottomNav'

interface ParentPageShellProps {
  title: string
  subtitle?: string
  badge?: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
  }
  /** Right-aligned header controls, e.g. a term picker */
  actions?: React.ReactNode
  /** 'bar': a small title, for a page whose content leads with its own big heading (Parent-Classes board). */
  titleSize?: 'page' | 'bar'
  children: React.ReactNode
}

/**
 * Standard scaffold for every parent-portal page: navbar + sidebar + a warm
 * stone background with a friendly page header, and the phone tab bar below
 * lg (Parent-Phone board).
 */
const ParentPageShell: React.FC<ParentPageShellProps> = ({
  title,
  subtitle,
  badge,
  actions,
  titleSize = 'page',
  children,
}) => {
  return (
    <>
      <Navbar />
      <Sidebar />
      {/* pb-24: room for the phone tab bar below lg. */}
      <main className="lg:ml-72 pt-20 pb-24 lg:pb-0 min-h-screen bg-stone-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={titleSize === 'bar' ? 'text-lg font-semibold text-slate-900' : 'text-2xl lg:text-3xl font-bold text-slate-900'}>{title}</h1>
                {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-3">
                {actions}
                {badge && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <badge.icon className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 whitespace-nowrap">
                      {badge.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
      <ParentBottomNav />
    </>
  )
}

export default ParentPageShell
