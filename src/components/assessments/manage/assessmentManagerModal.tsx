// File: src/components/assessments/manage/assessmentManagerModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../shared/modal'
import AssessmentAddModal from '../add/assessmentAddModal'
import AssessmentEditModal from '../edit/assessmentEditModal'
import AssessmentDeleteModal from '../delete/assessmentDeleteModal'
import { AssessmentPayload } from '@/services/types/assessment'
import {
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

interface AssessmentManagerModalProps {
  isOpen: boolean
  onClose: (didChange: boolean) => void
  classId: string
  assessments: AssessmentPayload[]
}

const AssessmentManagerModal: React.FC<AssessmentManagerModalProps> = ({
  isOpen,
  onClose,
  classId,
  assessments,
}) => {
  // Local working copy — the page refetches everything on close, so nested
  // modal mutations only need to keep this list accurate while open
  const [localAssessments, setLocalAssessments] = useState<AssessmentPayload[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [search, setSearch] = useState('')
  const [weightSort, setWeightSort] = useState<'asc' | 'desc'>('asc')

  // Nested sub-modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<AssessmentPayload | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AssessmentPayload | null>(null)

  // Seed/reset only on open — re-seeding from the live prop while open
  // would discard mutations made through the nested modals
  useEffect(() => {
    if (isOpen) {
      setLocalAssessments(assessments)
      setHasChanges(false)
      setSearch('')
      setWeightSort('asc')
      setShowAddModal(false)
      setEditingAssessment(null)
      setDeleteTarget(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleClose = () => onClose(hasChanges)

  const filteredAssessments = localAssessments
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aPoints = a.weightPoints || a.weightPercent || 0
      const bPoints = b.weightPoints || b.weightPercent || 0
      return weightSort === 'asc' ? aPoints - bPoints : bPoints - aPoints
    })

  const totalPoints = localAssessments
    .filter((a) => !a.parentAssessmentId)
    .reduce((sum, a) => sum + Number(a.weightPoints || a.weightPercent || 0), 0)

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Manage Assessments" style="max-w-3xl w-11/12">
        {/* Controls: Search / Sort / Add */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <input
            type="text"
            placeholder="Search assessments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium cursor-pointer text-sm whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4" />
            Add Assessment
          </button>
        </div>

        {/* Total Points Banner */}
        {totalPoints !== 100 ? (
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-100">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-amber-700 font-medium">
                Total: <strong>{totalPoints.toFixed(1)} points</strong>
              </p>
              <p className="text-amber-600 text-sm">
                Assessments should total 100 points for proper grade calculation.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 border-b border-emerald-100">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 font-medium">
              Total: <strong>{totalPoints.toFixed(1)} points</strong>
            </p>
          </div>
        )}

        {/* Assessment List */}
        <div className="p-6 space-y-3">
          {filteredAssessments.filter((a) => !a.parentAssessmentId).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500">No assessments found.</p>
            </div>
          ) : (
            filteredAssessments.map((a) => {
              if (a.parentAssessmentId) return null

              const childAssessments = a.isParent
                ? localAssessments.filter((child) => child.parentAssessmentId === a.assessmentId)
                : []

              return (
                <div key={a.assessmentId} className="space-y-2">
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
                        {a.maxScore && !a.isParent && (
                          <span>Max: {a.maxScore}</span>
                        )}
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
                        onClick={() => setEditingAssessment(a)}
                        className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors cursor-pointer text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={a.isParent ? 'Delete parent and all child assessments' : 'Delete assessment'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
            }).filter(Boolean)
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* ─ Add Assessment Modal ─ */}
      {showAddModal && (
        <AssessmentAddModal
          isOpen={showAddModal}
          classId={classId}
          onClose={() => setShowAddModal(false)}
          onAdd={(newA) => {
            setLocalAssessments((prev) => [newA, ...prev])
            setHasChanges(true)
            setShowAddModal(false)
          }}
          onBatchAdd={(newAssessments) => {
            setLocalAssessments((prev) => [...newAssessments, ...prev])
            setHasChanges(true)
            setShowAddModal(false)
          }}
        />
      )}

      {/* ─ Edit Assessment Modal ─ */}
      {editingAssessment && (
        <AssessmentEditModal
          isOpen={!!editingAssessment}
          assessment={editingAssessment}
          allAssessments={localAssessments}
          onClose={() => setEditingAssessment(null)}
          onUpdate={(updated) => {
            setLocalAssessments((prev) =>
              prev.map((a) => (a.assessmentId === updated.assessmentId ? updated : a))
            )
            setHasChanges(true)
            setEditingAssessment(null)
          }}
          onBatchUpdate={(updated, deleted) => {
            setLocalAssessments((prev) => {
              const remaining = prev.filter((a) => !deleted.includes(a.assessmentId))

              const next = [...remaining]
              updated.forEach((updatedAssessment) => {
                const existingIndex = next.findIndex((a) => a.assessmentId === updatedAssessment.assessmentId)
                if (existingIndex >= 0) {
                  next[existingIndex] = updatedAssessment
                } else {
                  next.push(updatedAssessment)
                }
              })

              return next
            })
            setHasChanges(true)
            setEditingAssessment(null)
          }}
        />
      )}

      {/* ─ Delete Assessment Modal ─ */}
      {deleteTarget && (
        <AssessmentDeleteModal
          isOpen={!!deleteTarget}
          assessment={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(deletedId) => {
            // DB cascades children of a deleted parent, so drop them locally too
            setLocalAssessments((prev) =>
              prev.filter((a) => a.assessmentId !== deletedId && a.parentAssessmentId !== deletedId)
            )
            setHasChanges(true)
            setDeleteTarget(null)
          }}
        />
      )}
    </>
  )
}

export default AssessmentManagerModal
