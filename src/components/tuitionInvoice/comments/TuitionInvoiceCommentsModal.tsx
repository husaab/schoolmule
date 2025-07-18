'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { 
  getTuitionInvoiceCommentsByInvoiceId,
  createTuitionInvoiceComment,
  updateTuitionInvoiceComment,
  deleteTuitionInvoiceComment
} from '@/services/tuitionInvoiceCommentService'
import { TuitionInvoiceCommentPayload } from '@/services/types/tuitionInvoiceComment'
import { TuitionInvoicePayload } from '@/services/types/tuitionInvoice'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface TuitionInvoiceCommentsModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: TuitionInvoicePayload
  commentCount: number
  onCommentCountChange: (newCount: number) => void
}

const TuitionInvoiceCommentsModal: React.FC<TuitionInvoiceCommentsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  commentCount,
  onCommentCountChange
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  const [comments, setComments] = useState<TuitionInvoiceCommentPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // Load comments when modal opens
  useEffect(() => {
    if (!isOpen || !invoice.invoiceId) return

    const loadComments = async () => {
      setLoading(true)
      try {
        const response = await getTuitionInvoiceCommentsByInvoiceId(invoice.invoiceId)
        if (response.status === 'success') {
          setComments(response.data)
          // Update comment count if it differs
          if (response.data.length !== commentCount) {
            onCommentCountChange(response.data.length)
          }
        } else {
          showNotification('Failed to load comments', 'error')
        }
      } catch (error) {
        console.error('Error loading comments:', error)
        showNotification('Error loading comments', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadComments()
  }, [isOpen, invoice.invoiceId])

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showNotification('Please enter a comment', 'error')
      return
    }

    // Validate required fields before sending
    if (!invoice?.invoiceId) {
      showNotification('Invoice ID is missing', 'error')
      return
    }

    if (!user?.id) {
      showNotification('User not authenticated', 'error')
      return
    }

    setAddingComment(true)
    try {
      const commenterName = user.username || 'Anonymous'
      
      const payload = {
        invoiceId: invoice.invoiceId,
        commenterId: user.id,
        commenterName: commenterName,
        comment: newComment.trim()
      }

      console.log('Creating comment with payload:', payload)
      const response = await createTuitionInvoiceComment(payload)
      if (response.status === 'success') {
        setComments(prev => [...prev, response.data])
        setNewComment('')
        onCommentCountChange(comments.length + 1)
        showNotification('Comment added successfully', 'success')
      } else {
        showNotification(response.message || 'Failed to add comment', 'error')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      showNotification('Error adding comment', 'error')
    } finally {
      setAddingComment(false)
    }
  }

  const handleStartEdit = (comment: TuitionInvoiceCommentPayload) => {
    setEditingCommentId(comment.commentId)
    setEditingText(comment.comment)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) {
      showNotification('Comment cannot be empty', 'error')
      return
    }

    if (!user?.id) {
      showNotification('User not authenticated', 'error')
      return
    }

    try {
      const response = await updateTuitionInvoiceComment(commentId, {
        comment: editingText.trim(),
        commenterId: user.id
      })
      
      if (response.status === 'success') {
        setComments(prev => 
          prev.map(comment => 
            comment.commentId === commentId 
              ? { ...comment, comment: editingText.trim() }
              : comment
          )
        )
        setEditingCommentId(null)
        setEditingText('')
        showNotification('Comment updated successfully', 'success')
      } else {
        showNotification(response.message || 'Failed to update comment', 'error')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      showNotification('Error updating comment', 'error')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    if (!user?.id) {
      showNotification('User not authenticated', 'error')
      return
    }

    try {
      const response = await deleteTuitionInvoiceComment(commentId, user.id)
      if (response.status === 'success') {
        setComments(prev => prev.filter(comment => comment.commentId !== commentId))
        onCommentCountChange(comments.length - 1)
        showNotification('Comment deleted successfully', 'success')
      } else {
        showNotification(response.message || 'Failed to delete comment', 'error')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      showNotification('Error deleting comment', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12 max-h-[80vh]">
      <div className="text-black flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Invoice Comments</h2>
              <p className="text-sm text-gray-600">
                {invoice.studentName} - {new Date(invoice.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Yet</h3>
              <p className="text-gray-500">Be the first to add a comment about this invoice.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.commentId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium text-sm">{comment.commenterName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDate(comment.createdAt)}
                      </div>
                      <button
                        onClick={() => handleStartEdit(comment)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit comment"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.commentId)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete comment"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {editingCommentId === comment.commentId ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                        maxLength={500}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment.commentId)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Comment */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <div className="flex items-center mb-2">
              <PlusIcon className="h-4 w-4 text-green-600 mr-2" />
              <span className="font-medium text-sm">Add Comment</span>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment here..."
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {newComment.length}/500 characters
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
                  disabled={addingComment}
                >
                  Close
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TuitionInvoiceCommentsModal