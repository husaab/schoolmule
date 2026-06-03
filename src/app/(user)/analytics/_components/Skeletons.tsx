'use client'

import React from 'react'

/** Shimmer placeholder matching StatCard's shape. */
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
    </div>
  </div>
)

/** Shimmer placeholder matching a chart card. */
export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 280 }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
    <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-4" />
    <div className="bg-slate-100 rounded-xl animate-pulse" style={{ height }} />
  </div>
)

/** Shimmer placeholder matching a table card. */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
    <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-4" />
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
)
