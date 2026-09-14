'use client'

// Placeholders shaped like the cards they stand in for, so the page does not
// reflow when analytics arrives a beat after the summary.

import React from 'react'
import Card from '@/components/ui/Card'

const HeaderLines: React.FC = () => (
  <div className="mb-4">
    <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
    <div className="h-3 w-52 rounded bg-slate-100 animate-pulse mt-1.5" />
  </div>
)

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 220 }) => (
  <Card>
    <HeaderLines />
    <div className="rounded-xl bg-slate-100 animate-pulse" style={{ height }} />
  </Card>
)

export const RowsSkeleton: React.FC<{ rows?: number; bare?: boolean }> = ({ rows = 5, bare = false }) => {
  const list = (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
  if (bare) return list
  return (
    <Card>
      <HeaderLines />
      {list}
    </Card>
  )
}
