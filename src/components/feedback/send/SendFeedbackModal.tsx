// src/components/feedback/SendFeedbackModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { getAssessmentsByClass } from '@/services/classService'
import { getStudentAssessment } from '@/services/assessmentService'
import { getParentsByStudentId } from '@/services/parentStudentService'
import { sendFeedback } from '@/services/feedbackService'
import { AssessmentPayload } from '@/services/types/assessment'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

interface SendFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSent: () => void
  student: { studentId: string; name: string }
  teacherId: string
  school: string
  assessmentsClassId: string
  courseName: string
}

const SendFeedbackModal: React.FC<SendFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSent,
  student,
  teacherId,
  school,
  assessmentsClassId,
  courseName
}) => {
  const showNotification = useNotificationStore(s => s.showNotification)

  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)

  const [parents, setParents] = useState<ParentStudentPayload[]>([])
  const [loadingParents, setLoadingParents] = useState(false)
  const [massAllParents, setMassAllParents] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  const [assessmentId, setAssessmentId] = useState<string>('')
  const [score, setScore] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const user = useUserStore((state) => state.user)

  // Load assessments & parents when modal opens
  useEffect(() => {
    if (!isOpen) return
    // assessments
    setLoadingAssessments(true)
    getAssessmentsByClass(assessmentsClassId)
      .then(res => {
        if (res.status === 'success') setAssessments(res.data)
        else showNotification('Failed to load assessments', 'error')
      })
      .catch(() => showNotification('Error fetching assessments', 'error'))
      .finally(() => setLoadingAssessments(false))
    // parents
    setLoadingParents(true)
    getParentsByStudentId(student.studentId)
      .then(res => {
        if (res.status === 'success') setParents(res.data!)
        else showNotification('Failed to load parents', 'error')
      })
      .catch(() => showNotification('Error fetching parents', 'error'))
      .finally(() => setLoadingParents(false))
  }, [isOpen, assessmentsClassId, student.studentId, showNotification])

  // When assessment changes, set weight and fetch student's previous score
  useEffect(() => {
    if (!assessmentId) {
      setScore('')
      setWeight('')
      return
    }
    const assessment = assessments.find(a => a.assessmentId === assessmentId)
    setWeight(assessment ? assessment.weightPercent : '')

    // Fetch existing student assessment record
    getStudentAssessment(student.studentId, assessmentId)
      .then(res => {
        if (res.status === 'success' && res.data) {
          setScore(res.data.score ?? 0)
        } else {
          setScore('')
        }
      })
      .catch(() => {
        setScore('')
        showNotification('Error fetching student score', 'error')
      })
  }, [assessmentId, assessments, student.studentId, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !assessmentId || score === '' || weight === '') {
      showNotification('Fill in all fields', 'error')
      return
    }
    const targets = massAllParents
      ? parents.map(p => p.parentId)
      : [selectedParentId]
    if (targets.length === 0) {
      showNotification('Select at least one parent', 'error')
      return
    }
    setSubmitting(true)
    try {
      // send feedback to each target
      await Promise.all(
        targets.map(parentId => {

           const parentLink = parents.find(p => p.parentId === parentId)!;
           const parentDisplayName = parentLink.parentName
            || `${parentLink.parentUser?.firstName} ${parentLink.parentUser?.lastName}`;

          return sendFeedback({
            senderId: teacherId,
            senderName: user.username!,
            recipientId: parentId!,
            recipientName: parentDisplayName, // parent name optional
            school,
            subject: subject.trim(),
            body: body.trim(),
            assessmentName: assessments.find(a => a.assessmentId === assessmentId)!.name,
            score: Number(score),
            weightPercentage: Number(weight),
            childName: student.name,
            courseName,
            studentId: student.studentId,
            studentName: student.name
          })
        }
        )
      )
      showNotification('Feedback sent!', 'success')
      onSent()
      onClose()
      // reset fields
      setAssessmentId('')
      setScore('')
      setWeight('')
      setSubject('')
      setBody('')
      setMassAllParents(false)
      setSelectedParentId('')
    } catch {
      showNotification('Failed to send feedback', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl font-semibold text-black mb-4">
        Send Feedback to Parents of {student.name}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Parent selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Recipients</label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={massAllParents}
              onChange={() => setMassAllParents(v => !v)}
              className="mr-2"
            />
            <span>Send to all parents</span>
          </label>
          {!massAllParents && (
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-white">
              {loadingParents
                ? <p className="text-gray-600">Loading...</p>
                : parents.length === 0
                  ? <p className="text-gray-600">No parents linked</p>
                  : parents.map(p => (
                      <div key={p.parentStudentLinkId} className="flex items-center mb-1">
                        <input
                          type="radio"
                          name="parent"
                          value={p.parentId!}
                          checked={selectedParentId === p.parentId}
                          onChange={() => setSelectedParentId(p.parentId!)}
                          className="mr-2"
                        />
                        <label className="text-black">
                          {(p.parentName || p.parentUser?.firstName + ' ' + p.parentUser?.lastName) + ' (' + p.parentEmail + ')'}
                        </label>
                      </div>
                    ))
              }
            </div>
          )}
        </div>
        {/* Assessment */}
        <div>
          <label className="block text-sm font-medium">Assessment</label>
          <select
            value={assessmentId}
            onChange={e => setAssessmentId(e.target.value)}
            className="w-full border rounded px-2 py-1"
            disabled={loadingAssessments}
            required
          >
            <option value="">Select assessment</option>
            {assessments.map(a => (
              <option key={a.assessmentId} value={a.assessmentId}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Score</label>
          <input
            type="number"
            value={score}
            readOnly
            className="w-full border rounded px-2 py-1 bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Weight (%)</label>
          <input
            type="number"
            value={weight}
            readOnly
            className="w-full border rounded px-2 py-1 bg-gray-100"
          />
        </div>
        {/* Message */}
        <div>
          <label className="block text-sm font-medium">Subject (optional)</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Comments</label>
          <textarea
            rows={4}
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full border rounded px-2 py-1 resize-y"
            required
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
            disabled={submitting}
          >Cancel</button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
            disabled={submitting}
          >{submitting ? 'Sending…' : 'Send'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default SendFeedbackModal
