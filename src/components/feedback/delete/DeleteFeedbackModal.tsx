'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteFeedback } from '@/services/feedbackService'
import { FeedbackPayload } from '@/services/types/feedback'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface DeleteFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  feedback: FeedbackPayload
  onDeleted: () => void
}

const DeleteFeedbackModal: React.FC<DeleteFeedbackModalProps> = ({
  isOpen,
  onClose,
  feedback,
  onDeleted
}) => {
  const [loading, setLoading] = useState(false)
  const showNotification = useNotificationStore(state => state.showNotification)

  const handleDelete = async () => {
    if (!feedback) return

    const feedbackId = feedback.feedbackId
    const senderId = feedback.senderId
    if (!feedbackId || !senderId) {
      showNotification('Missing feedback information', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await deleteFeedback(feedbackId, senderId)
      
      if (response.status === 'success') {
        showNotification('Feedback deleted successfully', 'success')
        onDeleted()
        onClose()
      } else {
        showNotification(response.message || 'Failed to delete feedback', 'error')
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      showNotification('Error deleting feedback', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!feedback) return null

  const recipientName = feedback.recipientName || 'Unknown Student'
  const subject = feedback.subject || 'No Subject'
  const createdAt = feedback.createdAt

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Delete Feedback
        </h3>
        
        <div className="text-sm text-gray-500 mb-6 text-left bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            <div><span className="font-medium">Student:</span> {recipientName}</div>
            <div><span className="font-medium">Subject:</span> {subject}</div>
            <div><span className="font-medium">Date:</span> {new Date(createdAt).toLocaleDateString()}</div>
            {feedback.body && (
              <div>
                <span className="font-medium">Message:</span>
                <div className="mt-1 max-h-20 overflow-y-auto text-xs bg-white p-2 rounded border">
                  {feedback.body}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete this feedback? This action cannot be undone.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="cursor-pointer flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete Feedback'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteFeedbackModal