// File: src/components/gradebook/AssessmentJumper.tsx
'use client'

import React, { useState } from 'react'
import { Bars3Icon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { AssessmentPayload } from '@/services/types/assessment'

interface AssessmentJumperProps {
  /** Parents/standalone only (the columns actually shown in the grid) */
  assessments: AssessmentPayload[]
  onJump: (assessmentId: string) => void
  activeAssessmentId: string | null
}

/**
 * Collapsible chip strip above the gradebook grid: click an assessment to
 * scroll the grid horizontally to its column. Purely presentational — the
 * parent owns the scroll/highlight mechanics.
 */
const AssessmentJumper: React.FC<AssessmentJumperProps> = ({
  assessments,
  onJump,
  activeAssessmentId,
}) => {
  // Open by default on desktop, collapsed on smaller screens
  const [isOpen, setIsOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )

  if (assessments.length === 0) return null

  return (
    <div className="border-b border-slate-100 bg-slate-50/60">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-2">
          <Bars3Icon className="h-4 w-4" />
          Jump to assessment ({assessments.length})
        </span>
        {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {assessments.map((a) => {
            const isActive = activeAssessmentId === a.assessmentId
            return (
              <button
                key={a.assessmentId}
                onClick={() => onJump(a.assessmentId)}
                className={`inline-flex flex-col items-start px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-transparent shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title={`Scroll to ${a.name}`}
              >
                <span className="font-medium truncate max-w-[140px]">{a.name}</span>
                <span className={isActive ? 'text-white/80' : 'text-slate-400'}>
                  {a.weightPoints || a.weightPercent || 0} pts
                  {a.date
                    ? ` · ${new Date(a.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}`
                    : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AssessmentJumper
