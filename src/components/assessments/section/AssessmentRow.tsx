// File: src/components/assessments/section/AssessmentRow.tsx
'use client'

import React from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { AssessmentPayload } from '@/services/types/assessment'

interface AssessmentRowProps {
  assessment: AssessmentPayload
  childAssessments: AssessmentPayload[]
  onEdit: () => void
  onDelete: () => void
  /** Dim + disable actions while another row is being edited */
  actionsDisabled: boolean
}

/** Read-only row for a parent or standalone assessment, with its children below. */
const AssessmentRow: React.FC<AssessmentRowProps> = ({
  assessment: a,
  childAssessments,
  onEdit,
  onDelete,
  actionsDisabled,
}) => {
  return (
    <div className="space-y-2">
      {/* Parent/Standalone Assessment */}
      <div
        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          a.isParent
            ? 'bg-blue-50 border-blue-100 hover:bg-blue-100'
            : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-slate-900">{a.name}</p>
            {a.isParent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                Multiple
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {a.weightPoints || a.weightPercent || 0} pts
            </span>
            {a.maxScore && !a.isParent && <span>Max: {a.maxScore}</span>}
            <span>{a.date ? a.date.split('T')[0] : 'No date'}</span>
            {a.isParent && childAssessments.length > 0 && (
              <span className="text-blue-600">
                {childAssessments.length} sub-assessment{childAssessments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            disabled={actionsDisabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors cursor-pointer text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={actionsDisabled}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={a.isParent ? 'Delete parent and all child assessments' : 'Delete assessment'}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Child Assessments */}
      {a.isParent && childAssessments.length > 0 && (
        <div className="ml-6 space-y-1">
          {childAssessments.map((child) => (
            <div
              key={child.assessmentId}
              className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">└─</span>
                  <p className="font-medium text-slate-700 text-sm">{child.name}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                    Individual
                  </span>
                </div>
                <div className="flex items-center gap-4 ml-6 mt-1 text-xs text-slate-400">
                  <span>{child.weightPoints || child.weightPercent || 0} pts</span>
                  {child.maxScore && <span>Max: {child.maxScore}</span>}
                  <span>{child.date ? child.date.split('T')[0] : 'No date'}</span>
                </div>
              </div>
              <span className="text-xs text-slate-400 italic">Edit via parent</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AssessmentRow
