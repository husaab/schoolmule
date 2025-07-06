'use client'

import React from 'react'
import Modal from '@/components/shared/modal'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ViewFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  feedback: any
}

const ViewFeedbackModal: React.FC<ViewFeedbackModalProps> = ({
  isOpen,
  onClose,
  feedback
}) => {
  if (!feedback) return null

  const recipientName = feedback.recipientName || feedback.recipient_name || 'Unknown Student'
  const senderName = feedback.senderName || feedback.sender_name || 'Unknown Teacher'
  const subject = feedback.subject || 'No Subject'
  const body = feedback.body || 'No message content'
  const assessmentName = feedback.assessmentName || feedback.assessment_name
  const score = feedback.score
  const weightPercentage = feedback.weightPercentage || feedback.weight_percentage
  const createdAt = feedback.createdAt || feedback.created_at
  const lastModifiedAt = feedback.lastModifiedAt || feedback.last_modified_at
  const school = feedback.school

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Feedback Details
        </h3>
      </div>

      <div className="space-y-4">
        {/* Header Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Student:</span>
              <div className="text-gray-900">{recipientName}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Teacher:</span>
              <div className="text-gray-900">{senderName}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">School:</span>
              <div className="text-gray-900">{school || 'Not specified'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date Sent:</span>
              <div className="text-gray-900">{formatDateTime(createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
            {subject}
          </div>
        </div>

        {/* Assessment Info */}
        {(assessmentName || score !== null || weightPercentage !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {assessmentName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment
                </label>
                <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                  {assessmentName}
                </div>
              </div>
            )}
            
            {score !== null && score !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score
                </label>
                <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                  {score}
                </div>
              </div>
            )}
            
            {weightPercentage !== null && weightPercentage !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight %
                </label>
                <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                  {weightPercentage}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <div className="bg-white border border-gray-300 rounded-md px-3 py-4 text-sm text-gray-900 min-h-[100px] whitespace-pre-wrap">
            {body}
          </div>
        </div>

        {/* Last Modified */}
        {lastModifiedAt && lastModifiedAt !== createdAt && (
          <div className="text-xs text-gray-500 border-t pt-3">
            Last modified: {formatDateTime(lastModifiedAt)}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={onClose}
          className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default ViewFeedbackModal