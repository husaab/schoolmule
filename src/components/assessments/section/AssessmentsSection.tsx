// File: src/components/assessments/section/AssessmentsSection.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { getAssessmentsByClass } from '@/services/classService'
import type { AssessmentPayload } from '@/services/types/assessment'
import Spinner from '@/components/Spinner'
import {
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import AssessmentRow from './AssessmentRow'
import AssessmentInlineForm from './AssessmentInlineForm'
import AssessmentDeleteInlineConfirm from './AssessmentDeleteInlineConfirm'
import TotalPointsBanner from './TotalPointsBanner'
import type { AssessmentMutation } from './useAssessmentForm'

interface AssessmentsSectionProps {
  classId: string
  /** Notified after any successful add/edit/delete — lets a host page refresh its own data */
  onMutated?: () => void
}

type RowMode =
  | { kind: 'view' }
  | { kind: 'editing'; assessmentId: string }
  | { kind: 'deleting'; assessmentId: string }

/**
 * The primary assessment editor for standard-grade classes: inline add/edit/
 * delete directly in the list (no stacked modals).
 */
const AssessmentsSection: React.FC<AssessmentsSectionProps> = ({ classId, onMutated }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [assessLoading, setAssessLoading] = useState(true)
  const [assessError, setAssessError] = useState<string | null>(null)
  const [searchAssess, setSearchAssess] = useState('')
  const [weightSort, setWeightSort] = useState<'asc' | 'desc'>('asc')

  // Only one row may be edited/deleted at a time; the add composer excludes both
  const [rowMode, setRowMode] = useState<RowMode>({ kind: 'view' })
  const [composerOpen, setComposerOpen] = useState(false)

  const fetchAssessments = async () => {
    try {
      const res = await getAssessmentsByClass(classId)
      if (res.status === 'success') {
        setAssessments(res.data)
        setAssessError(null)
      } else {
        setAssessError(res.message || 'Failed to load assessments')
      }
    } catch (err) {
      console.error('Error fetching assessments:', err)
      setAssessError('Error fetching assessments')
    } finally {
      setAssessLoading(false)
    }
  }

  useEffect(() => {
    setAssessLoading(true)
    fetchAssessments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  // Single reconciliation point for every mutation (add/edit/delete)
  const applyMutation = ({ updated, deletedIds, needsRefetch }: AssessmentMutation) => {
    setAssessments((prev) => {
      const filtered = prev.filter(
        (a) =>
          !deletedIds.includes(a.assessmentId) &&
          !(a.parentAssessmentId && deletedIds.includes(a.parentAssessmentId))
      )
      const next = [...filtered]
      updated.forEach((u) => {
        const i = next.findIndex((a) => a.assessmentId === u.assessmentId)
        if (i >= 0) next[i] = u
        else next.push(u)
      })
      return next
    })
    setRowMode({ kind: 'view' })
    setComposerOpen(false)
    // Safety net after multi-request parent edits — soft re-sync, errors swallowed
    if (needsRefetch) {
      fetchAssessments().catch(() => {})
    }
    onMutated?.()
  }

  const openComposer = () => {
    setComposerOpen(true)
    setRowMode({ kind: 'view' })
  }

  const filteredAssessments = assessments
    .filter((a) => a.name.toLowerCase().includes(searchAssess.toLowerCase()))
    .sort((a, b) => {
      const aPoints = a.weightPoints || a.weightPercent || 0
      const bPoints = b.weightPoints || b.weightPercent || 0
      return weightSort === 'asc' ? aPoints - bPoints : bPoints - aPoints
    })

  const topLevelAssessments = filteredAssessments.filter((a) => !a.parentAssessmentId)

  const totalPoints = assessments
    .filter((a) => !a.parentAssessmentId)
    .reduce((sum, a) => sum + Number(a.weightPoints || a.weightPercent || 0), 0)

  const editingBusy = rowMode.kind !== 'view' || composerOpen

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white cursor-pointer hover:from-cyan-600 hover:to-teal-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold">Assessments</span>
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
            {assessments.filter((a) => !a.parentAssessmentId).length} total
          </span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
      </button>

      {!isCollapsed && (
        <div>
          {/* Controls: Search / Sort / Add */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              placeholder="Search assessments…"
              value={searchAssess}
              onChange={(e) => setSearchAssess(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-black"
            />

            <select
              value={weightSort}
              onChange={(e) => setWeightSort(e.target.value as 'asc' | 'desc')}
              className="w-full sm:w-40 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-black cursor-pointer"
            >
              <option value="asc">Points ↑</option>
              <option value="desc">Points ↓</option>
            </select>

            <button
              onClick={openComposer}
              disabled={composerOpen}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm whitespace-nowrap disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              Add Assessment
            </button>
          </div>

          {/* Total Points Banner */}
          <TotalPointsBanner totalPoints={totalPoints} />

          {/* Add composer */}
          {composerOpen && (
            <div className="px-6 pt-6">
              <AssessmentInlineForm
                mode="add"
                classId={classId}
                allAssessments={assessments}
                onSuccess={applyMutation}
                onCancel={() => setComposerOpen(false)}
              />
            </div>
          )}

          {/* Assessment List */}
          <div className="p-6 space-y-3">
            {assessLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : assessError ? (
              <p className="text-red-600 text-center py-4">{assessError}</p>
            ) : topLevelAssessments.length === 0 && !composerOpen ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-4">No assessments yet.</p>
                <button
                  onClick={openComposer}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add your first assessment
                </button>
              </div>
            ) : (
              topLevelAssessments.map((a) => {
                const childAssessments = a.isParent
                  ? assessments
                      .filter((child) => child.parentAssessmentId === a.assessmentId)
                      .sort((x, y) => (x.sortOrder || 0) - (y.sortOrder || 0))
                  : []

                if (rowMode.kind === 'editing' && rowMode.assessmentId === a.assessmentId) {
                  return (
                    <AssessmentInlineForm
                      key={a.assessmentId}
                      mode="edit"
                      classId={classId}
                      assessment={a}
                      allAssessments={assessments}
                      onSuccess={applyMutation}
                      onCancel={() => setRowMode({ kind: 'view' })}
                    />
                  )
                }

                if (rowMode.kind === 'deleting' && rowMode.assessmentId === a.assessmentId) {
                  return (
                    <AssessmentDeleteInlineConfirm
                      key={a.assessmentId}
                      assessment={a}
                      onDeleted={(deletedId) =>
                        applyMutation({
                          updated: [],
                          deletedIds: [deletedId],
                          needsRefetch: false,
                        })
                      }
                      onCancel={() => setRowMode({ kind: 'view' })}
                    />
                  )
                }

                return (
                  <AssessmentRow
                    key={a.assessmentId}
                    assessment={a}
                    childAssessments={childAssessments}
                    onEdit={() => {
                      setRowMode({ kind: 'editing', assessmentId: a.assessmentId })
                      setComposerOpen(false)
                    }}
                    onDelete={() => {
                      setRowMode({ kind: 'deleting', assessmentId: a.assessmentId })
                      setComposerOpen(false)
                    }}
                    actionsDisabled={editingBusy}
                  />
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentsSection
