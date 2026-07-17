// File: src/components/assessments/section/ChildRowEditor.tsx
'use client'

import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { ChildDraft } from './useAssessmentForm'

interface ChildRowEditorProps {
  child: ChildDraft
  index: number
  onChange: (childId: string, field: keyof ChildDraft, value: string) => void
  onRemove: (childId: string) => void
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent'

const ChildRowEditor: React.FC<ChildRowEditorProps> = ({ child, index, onChange, onRemove }) => {
  return (
    <div
      className={`flex flex-wrap sm:flex-nowrap gap-2 items-center p-2 rounded-lg border ${
        child.isNew ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'
      }`}
    >
      <div className="w-6 text-center text-sm text-slate-400 font-medium shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-[140px]">
        <input
          type="text"
          value={child.name}
          onChange={(e) => onChange(child.assessmentId, 'name', e.target.value)}
          className={inputClass}
          placeholder={`Assessment ${index + 1}`}
          required
        />
      </div>
      <div className="w-20 shrink-0">
        <input
          type="number"
          value={child.weightPoints}
          onChange={(e) => onChange(child.assessmentId, 'weightPoints', e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="0"
          min="0"
          step="0.01"
          required
          title="Points toward final grade"
        />
      </div>
      <span className="text-xs text-slate-400 shrink-0">pts</span>
      <div className="w-20 shrink-0">
        <input
          type="number"
          value={child.maxScore}
          onChange={(e) => onChange(child.assessmentId, 'maxScore', e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="100"
          min="0"
          step="0.01"
          required
          title="Maximum score (out of)"
        />
      </div>
      <span className="text-xs text-slate-400 shrink-0">out of</span>
      <div className="w-36 shrink-0">
        <input
          type="date"
          value={child.date}
          onChange={(e) => onChange(child.assessmentId, 'date', e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(child.assessmentId)}
        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
        title="Remove this individual assessment"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

export default ChildRowEditor
