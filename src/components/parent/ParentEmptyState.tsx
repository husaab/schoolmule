'use client'

import React from 'react'

interface ParentEmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  message: string
}

/** Warm, friendly empty state used across the parent portal. */
const ParentEmptyState: React.FC<ParentEmptyStateProps> = ({ icon: Icon, title, message }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-12 text-center">
    <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
      <Icon className="h-8 w-8 text-amber-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mx-auto">{message}</p>
  </div>
)

export default ParentEmptyState
