// File: src/components/assessments/section/AssessmentInlineForm.tsx
'use client'

import React from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { AssessmentPayload } from '@/services/types/assessment'
import Spinner from '@/components/Spinner'
import ChildRowEditor from './ChildRowEditor'
import { useAssessmentForm, AssessmentMutation } from './useAssessmentForm'

interface AssessmentInlineFormProps {
  mode: 'add' | 'edit'
  classId: string
  assessment?: AssessmentPayload
  allAssessments: AssessmentPayload[]
  onSuccess: (result: AssessmentMutation) => void
  onCancel: () => void
}

const fieldClass =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-black bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all'

/**
 * Inline add/edit form for an assessment (incl. "Multiple" parent + children).
 * Replaces the old stacked add/edit modals with an in-place editor.
 */
const AssessmentInlineForm: React.FC<AssessmentInlineFormProps> = ({
  mode,
  classId,
  assessment,
  allAssessments,
  onSuccess,
  onCancel,
}) => {
  const form = useAssessmentForm({ mode, classId, assessment, allAssessments, onSuccess })

  const parentPointsMissing =
    form.isParent && (!form.weightPoints || parseFloat(form.weightPoints) <= 0)

  return (
    <form
      onSubmit={form.handleSubmit}
      className="p-4 bg-white border-2 border-cyan-200 rounded-xl space-y-4 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className={form.isParent ? 'sm:col-span-2' : ''}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            className={fieldClass}
            placeholder="e.g. Midterm Exam"
            autoFocus
          />
        </div>

        {/* Points toward final grade */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Points toward final grade
          </label>
          <input
            type="number"
            required
            value={form.weightPoints}
            onChange={(e) => form.setWeightPointsMirrored(e.target.value)}
            className={fieldClass}
            placeholder="e.g. 15"
            min={0}
            step={0.01}
          />
          <p className="text-xs text-slate-500 mt-1">
            How many points this assessment contributes to the final grade — all of a
            class&apos;s assessments together should total 100 points
          </p>
        </div>

        {/* Maximum score — standalone only */}
        {!form.isParent && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Maximum score</label>
            <input
              type="number"
              required
              value={form.maxScore}
              onChange={(e) => form.setMaxScoreTouchedValue(e.target.value)}
              className={fieldClass}
              placeholder="e.g. 40"
              min={0}
              step={0.01}
            />
            <p className="text-xs text-slate-500 mt-1">
              Total points possible (e.g., 40 for a test out of 40)
            </p>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Assessment Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => form.setDate(e.target.value)}
            className={fieldClass}
          />
          <p className="text-xs text-slate-500 mt-1">
            When was this assessment conducted? (optional)
          </p>
        </div>
      </div>

      {/* Multiple-assessment toggle — only choosable at creation time */}
      {mode === 'add' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isParent}
            onChange={(e) => form.setIsParent(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-700">
            Make this a multiple assessment (grouped sub-assessments)
          </span>
        </label>
      )}

      {/* Warning if points not filled for multiple assessment */}
      {parentPointsMissing && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            Fill in &quot;Points toward final grade&quot; above before adding individual
            assessments.
          </p>
        </div>
      )}

      {/* Children editor */}
      {form.isParent && !parentPointsMissing && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-700">Individual Assessments</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={form.addChild}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 cursor-pointer transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Individual
              </button>
              {form.activeChildren.length > 0 && (
                <button
                  type="button"
                  onClick={form.distributeEqually}
                  className="px-3 py-1.5 text-xs font-medium text-cyan-700 border border-cyan-200 rounded-lg hover:bg-cyan-50 cursor-pointer transition-colors"
                >
                  Distribute points equally
                </button>
              )}
            </div>
          </div>

          {form.activeChildren.length === 0 ? (
            <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm">No individual assessments yet.</p>
              <p className="text-xs mt-1">Click &quot;Add Individual&quot; to create sub-assessments.</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50">
              {form.activeChildren.map((child, index) => (
                <ChildRowEditor
                  key={child.assessmentId}
                  child={child}
                  index={index}
                  onChange={form.updateChild}
                  onRemove={form.removeChild}
                />
              ))}
            </div>
          )}

          {form.childPointsError && (
            <p
              className={`text-xs ${
                form.childPointsError.includes('must not exceed')
                  ? 'text-red-600'
                  : 'text-amber-600'
              }`}
            >
              {form.childPointsError}
            </p>
          )}

          <p className="text-xs text-slate-500">
            Individual points should total the multiple assessment points. Each individual
            assessment also needs a maximum score (how many points it is out of).
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={form.submitting}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium cursor-pointer text-sm disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={form.submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm disabled:opacity-50"
        >
          {form.submitting && <Spinner size="sm" />}
          {mode === 'add' ? 'Add Assessment' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default AssessmentInlineForm
