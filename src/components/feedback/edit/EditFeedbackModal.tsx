'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { updateFeedback } from '@/services/feedbackService'

interface EditFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  feedback: any
  onUpdated: () => void
}

const EditFeedbackModal: React.FC<EditFeedbackModalProps> = ({
  isOpen,
  onClose,
  feedback,
  onUpdated
}) => {
  const [loading, setLoading] = useState(false)
  const showNotification = useNotificationStore(state => state.showNotification)
  
  // Form fields
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [assessmentName, setAssessmentName] = useState('')
  const [score, setScore] = useState('')
  const [weightPercentage, setWeightPercentage] = useState('')

  // Initialize form with feedback data
  useEffect(() => {
    if (feedback && isOpen) {
      setSubject(feedback.subject || '')
      setBody(feedback.body || '')
      setAssessmentName(feedback.assessmentName || feedback.assessment_name || '')
      setScore(String(feedback.score || ''))
      setWeightPercentage(String(feedback.weightPercentage || feedback.weight_percentage || ''))
    }
  }, [feedback, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedback) return

    const feedbackId = feedback.feedbackId || feedback.feedback_id
    const senderId = feedback.senderId || feedback.sender_id

    if (!feedbackId || !senderId) {
      showNotification('Missing feedback information', 'error')
      return
    }

    if (!body.trim()) {
      showNotification('Message body is required', 'error')
      return
    }

    const scoreNum = parseFloat(score)
    const weightNum = parseFloat(weightPercentage)

    if (score && (isNaN(scoreNum) || scoreNum < 0)) {
      showNotification('Score must be a valid positive number', 'error')
      return
    }

    if (weightPercentage && (isNaN(weightNum) || weightNum < 0 || weightNum > 100)) {
      showNotification('Weight percentage must be between 0 and 100', 'error')
      return
    }

    setLoading(true)
    try {
      const updateData = {
        senderId,
        subject: subject.trim() || undefined,
        body: body.trim(),
        assessmentName: assessmentName.trim() || undefined,
        score: score ? scoreNum : undefined,
        weightPercentage: weightPercentage ? weightNum : undefined
      }

      const response = await updateFeedback(feedbackId, updateData)
      
      if (response.status === 'success') {
        showNotification('Feedback updated successfully', 'success')
        onUpdated()
        onClose()
      } else {
        showNotification(response.message || 'Failed to update feedback', 'error')
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      showNotification('Error updating feedback', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!feedback) return null

  const recipientName = feedback.recipientName || feedback.recipient_name || 'Unknown Student'
  const createdAt = feedback.createdAt || feedback.created_at

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style="p-6 max-w-2xl w-11/12">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Edit Feedback
        </h3>
        <div className="text-sm text-gray-500 mt-1">
          Student: {recipientName} • Date: {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Enter feedback subject"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Enter your feedback message"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="assessmentName" className="block text-sm font-medium text-gray-700 mb-1">
              Assessment Name
            </label>
            <input
              type="text"
              id="assessmentName"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., Quiz 1"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
              Score
            </label>
            <input
              type="number"
              id="score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min="0"
              step="0.1"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="85"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="weightPercentage" className="block text-sm font-medium text-gray-700 mb-1">
              Weight %
            </label>
            <input
              type="number"
              id="weightPercentage"
              value={weightPercentage}
              onChange={(e) => setWeightPercentage(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              readOnly
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="100"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="cursor-pointer flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="cursor-pointer flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditFeedbackModal