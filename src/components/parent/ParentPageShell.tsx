'use client'

import React from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'

interface ParentPageShellProps {
  title: string
  subtitle?: string
  badge?: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
  }
  /** Right-aligned header controls, e.g. a term picker */
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Standard scaffold for every parent-portal page: navbar + sidebar + a warm
 * stone background with a friendly page header.
 */
const ParentPageShell: React.FC<ParentPageShellProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
}) => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-stone-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{title}</h1>
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
    </>
  )
}

export default ParentPageShell
