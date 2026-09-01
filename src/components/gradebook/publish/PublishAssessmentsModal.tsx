'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  XMarkIcon,
  MegaphoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import type { AssessmentPayload } from '@/services/types/assessment'
import type {
  AssessmentPublicationState,
  PublishPreview,
  PublishResult,
} from '@/services/types/assessmentPublication'
import {
  previewPublish,
  publishAssessments,
  unpublishAssessments,
  updatePublicationComment,
} from '@/services/assessmentPublicationService'
import Spinner from '@/components/Spinner'

interface PublishAssessmentsModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  /** The assessments being acted on, in gradebook order. */
  assessments: AssessmentPayload[]
  publications: Record<string, AssessmentPublicationState>
  /** Called after any change, so the gradebook can refresh its badges. */
  onChanged: () => void
}

/**
 * Publish / manage assessments for parents.
 *
 * One modal for both jobs on purpose: "publish these three" and "manage
 * this already-published one" differ only in what's preselected, and a
 * teacher correcting a grade needs the same re-notify button either way.
 *
 * Comment edits save silently — fixing a typo must never re-email a class.
 * Re-notifying is always an explicit "Publish & Notify".
 */
const PublishAssessmentsModal: React.FC<PublishAssessmentsModalProps> = ({
  isOpen,
  onClose,
  classId,
  assessments,
  publications,
  onChanged,
}) => {
  const [preview, setPreview] = useState<PublishPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [batchComment, setBatchComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false)

  const assessmentIds = useMemo(
    () => assessments.map((a) => a.assessmentId),
    [assessments],
  )
  const anyPublished = assessments.some((a) => publications[a.assessmentId]?.isPublished)

  // Reset only on the closed -> open transition.
  //
  // Not on every `publications` change: publishing calls onChanged(), which
  // refetches publication state and hands this modal a new object identity
  // while it is still open. Resetting on that would wipe the results screen
  // the teacher is currently reading, seconds after their publish landed,
  // making it look as though nothing happened.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const seeded: Record<string, string> = {}
      for (const a of assessments) {
        seeded[a.assessmentId] = publications[a.assessmentId]?.comment || ''
      }
      setComments(seeded)
      setBatchComment('')
      setResult(null)
      setError(null)
      setConfirmingUnpublish(false)
    }
    wasOpen.current = isOpen
  }, [isOpen, assessments, publications])

  // Ask the server what this selection would actually do.
  useEffect(() => {
    if (!isOpen || assessmentIds.length === 0) return
    let cancelled = false
    setLoadingPreview(true)
    previewPublish(classId, assessmentIds)
      .then((res) => {
        if (!cancelled) setPreview(res.data ?? null)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError('Could not check this selection. You can still publish.')
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, classId, assessmentIds])

  const warningFor = useCallback(
    (assessmentId: string) => preview?.warnings.find((w) => w.assessmentId === assessmentId),
    [preview],
  )

  const nonEmptyComments = useCallback(() => {
    const out: Record<string, string> = {}
    for (const [id, text] of Object.entries(comments)) {
      if (text.trim()) out[id] = text.trim()
    }
    return out
  }, [comments])

  const handlePublish = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await publishAssessments(classId, {
        assessmentIds,
        batchComment: batchComment.trim() || undefined,
        assessmentComments: nonEmptyComments(),
      })
      if (res.status !== 'success' || !res.data) {
        throw new Error(res.message || 'Publish failed')
      }
      setResult(res.data)
      onChanged()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveCommentsOnly = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await Promise.all(
        assessments.map((a) =>
          updatePublicationComment(classId, a.assessmentId, comments[a.assessmentId]?.trim() || null),
        ),
      )
      onChanged()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Could not save comments')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnpublish = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await unpublishAssessments(classId, assessmentIds)
      onChanged()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Could not unpublish')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const recipientLabel = preview
    ? `${preview.recipientCount} parent${preview.recipientCount === 1 ? '' : 's'}`
    : '…'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
              <MegaphoneIcon className="w-5 h-5 text-cyan-600" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {result ? 'Publish Results' : 'Publish to Parents'}
              </h2>
              <p className="text-sm text-slate-500">
                {result
                  ? `${result.emailSummary.sent} of ${result.emailSummary.attempted} notification${result.emailSummary.attempted === 1 ? '' : 's'} sent`
                  : `${assessments.length} assessment${assessments.length === 1 ? '' : 's'} selected`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {result?.emailSummary.notificationError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
              {result.emailSummary.notificationError}
            </div>
          )}

          {result ? (
            <ul className="divide-y divide-slate-100">
              {result.emailSummary.results.map((r) => (
                <li key={r.studentId} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700 truncate">{r.studentName}</span>
                  {r.status === 'sent' ? (
                    <span className="text-xs text-emerald-600 whitespace-nowrap">
                      Sent to {r.sentTo?.length ?? 0}
                    </span>
                  ) : r.status === 'skipped' ? (
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {r.reason || 'Skipped'}
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 truncate max-w-[50%]" title={r.error}>
                      Failed: {r.error}
                    </span>
                  )}
                </li>
              ))}
              {result.emailSummary.results.length === 0 && (
                <li className="py-2.5 text-sm text-slate-500">
                  Published. No students have a grade on these assessments yet, so no emails were
                  sent.
                </li>
              )}
            </ul>
          ) : (
            <>
              {/* Per-assessment rows */}
              <div className="divide-y divide-slate-100">
                {assessments.map((a) => {
                  const warning = warningFor(a.assessmentId)
                  const state = publications[a.assessmentId]
                  return (
                    <div key={a.assessmentId} className="py-4 first:pt-0">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{a.name}</p>
                          {state?.isPublished && (
                            <p className="text-xs text-emerald-600">Already live to parents</p>
                          )}
                        </div>
                        {loadingPreview ? (
                          <span className="text-xs text-slate-400">checking…</span>
                        ) : warning ? (
                          <span className="flex items-center gap-1 text-xs text-amber-700 whitespace-nowrap">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {warning.ungradedStudentCount} of {warning.totalStudents} ungraded
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 whitespace-nowrap">
                            All graded
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={comments[a.assessmentId] ?? ''}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [a.assessmentId]: e.target.value }))
                        }
                        placeholder="Note for this assessment (optional)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Batch comment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message to all parents (optional)
                </label>
                <textarea
                  value={batchComment}
                  onChange={(e) => setBatchComment(e.target.value)}
                  rows={3}
                  placeholder="Shared across every assessment in this batch — appears in the email."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none"
                />
              </div>

              {/* Recipient summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 space-y-1">
                {loadingPreview ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>Working out who gets notified…</span>
                  </div>
                ) : (
                  <>
                    <p>
                      This will notify <strong className="text-slate-800">{recipientLabel}</strong>{' '}
                      covering {preview?.studentCount ?? 0} student
                      {preview?.studentCount === 1 ? '' : 's'}.
                    </p>
                    {(preview?.studentsWithoutEmail ?? 0) > 0 && (
                      <p className="text-amber-700">
                        {preview?.studentsWithoutEmail} student
                        {preview?.studentsWithoutEmail === 1 ? ' has' : 's have'} no guardian email
                        on file and will be skipped.
                      </p>
                    )}
                    {(preview?.cascadedChildIds.length ?? 0) > 0 && (
                      <p className="text-slate-500">
                        Includes {preview?.cascadedChildIds.length} graded item
                        {preview?.cascadedChildIds.length === 1 ? '' : 's'} inside the selected
                        categories.
                      </p>
                    )}
                    {(preview?.skippedUngradedChildIds.length ?? 0) > 0 && (
                      <p className="text-slate-500">
                        {preview?.skippedUngradedChildIds.length} ungraded item
                        {preview?.skippedUngradedChildIds.length === 1 ? '' : 's'} inside those
                        categories stay unpublished.
                      </p>
                    )}
                    <p className="text-slate-500">
                      Students without a grade are left out of this send — publish again once
                      they&rsquo;re marked.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          {result ? (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium cursor-pointer hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          ) : confirmingUnpublish ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Hide {assessments.length === 1 ? 'this assessment' : 'these assessments'} from
                parents? Emails already sent can&rsquo;t be recalled.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setConfirmingUnpublish(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnpublish}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-medium cursor-pointer hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? 'Unpublishing…' : 'Unpublish'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {anyPublished ? (
                <button
                  onClick={() => setConfirmingUnpublish(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  <EyeSlashIcon className="w-4 h-4" />
                  Unpublish
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                {anyPublished && (
                  <button
                    onClick={handleSaveCommentsOnly}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium cursor-pointer hover:bg-slate-50 disabled:opacity-50"
                    title="Update the notes without emailing parents again"
                  >
                    Save comments only
                  </button>
                )}
                <button
                  onClick={handlePublish}
                  disabled={submitting || assessments.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium cursor-pointer hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 shadow-sm"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {submitting
                    ? 'Publishing…'
                    : anyPublished
                      ? 'Publish & Notify again'
                      : `Publish & Notify${preview ? ` ${preview.recipientCount}` : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublishAssessmentsModal
