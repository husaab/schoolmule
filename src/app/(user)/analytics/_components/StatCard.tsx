'use client'

import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Tailwind gradient stops, e.g. 'from-cyan-500 to-cyan-600' */
  color: string
  /** Optional small delta badge, e.g. +3.2 vs last term */
  delta?: number | null
  deltaLabel?: string
  /** Optional secondary line under the value */
  sub?: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, delta, deltaLabel, sub }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 truncate">
          {label}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {delta != null && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
              title={deltaLabel}
            >
              {delta >= 0 ? '+' : ''}
              {delta}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
)

export default StatCard
