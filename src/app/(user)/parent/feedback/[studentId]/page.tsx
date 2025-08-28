'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import { getFeedbackByStudentId } from '@/services/feedbackService'
import { FeedbackPayload } from '@/services/types/feedback'
import ViewFeedbackModal from '@/components/feedback/view/ViewFeedbackModal'
import { EyeIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'
import ReplyMessageModal from '@/components/messages/reply/ReplyMessageModal'
import { MessagePayload } from '@/services/types/message'

const ParentStudentFeedbackPage: React.FC = () => {
  const params = useParams()
  const studentId = params.studentId as string

  const [feedbackList, setFeedbackList] = useState<FeedbackPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackPayload | null>(null)
  const [replyTarget, setReplyTarget] = useState<MessagePayload | null>(null)

  // Load feedback for the student
  useEffect(() => {
    const loadFeedback = async () => {
      if (!studentId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await getFeedbackByStudentId(studentId)
        if (response.status === 'success') {
          setFeedbackList(response.data)
        } else {
          setError(response.message || 'Failed to load feedback')
        }
      } catch (err) {
        console.error('Error loading feedback:', err)
        setError('Error loading feedback')
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="text-center text-red-600 mt-10">
            {error}
          </div>
        </main>
      </>
    )
  }

  // Get student name from first feedback entry
  const studentName = feedbackList.length > 0 
    ? (feedbackList[0].studentName || 'Student')
    : 'Student'

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
            Feedback for {studentName}
          </h1>
          <p className="text-gray-600 text-sm">
            View all feedback received from teachers
          </p>
        </div>

        {feedbackList.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                📚
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
              <p className="text-sm text-gray-500">
                No feedback has been received for this student yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[80vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Course
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Assessment
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Student Score
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Weight
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Teacher
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbackList.map((feedback, index) => {
                    const createdAt = feedback.createdAt
                    const senderName = feedback.senderName || 'Teacher'
                    const courseName = feedback.courseName || feedback.subject 
                    const assessmentName = feedback.assessmentName
                    const score = feedback.score
                    const weightPercentage = feedback.weightPercentage
                    
                    return (
                      <tr key={feedback.feedbackId || index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {courseName && <div>Course: {courseName}</div>}
                            {senderName && <div>Teacher: {senderName}</div>}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {courseName && <div className="text-gray-500">{courseName}</div>}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {assessmentName || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {score !== null && score !== undefined ? `${score}/100` : '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {weightPercentage ? `${weightPercentage}%` : '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {senderName}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedFeedback(feedback)}
                            className="text-blue-600 hover:text-blue-700 pr-3 rounded-md transition-colors cursor-pointer transform transition duration-200 hover:scale-130"
                            title="View Feedback"
                          >
                            <EyeIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Convert feedback to message format for reply
                              const messageData: MessagePayload = {
                                message_id: feedback.feedbackId || '',
                                sender_id: feedback.senderId,
                                sender_name: feedback.senderName,
                                recipient_id: feedback.recipientId,
                                recipient_name: feedback.recipientName,
                                school: feedback.school,
                                subject: `Feedback for ${studentName} on ${assessmentName} in ${courseName || feedback.subject}`,
                                body: feedback.body,
                                created_at: feedback.createdAt || new Date().toISOString(),
                                last_modified_at: feedback.lastModifiedAt
                              }
                              setReplyTarget(messageData)
                            }}
                            title="Reply"
                            className="text-cyan-600 hover:text-cyan-700 cursor-pointer transform transition duration-200 hover:scale-130"
                          >
                            <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feedback Summary */}
        {feedbackList.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">
                {feedbackList.length}
              </div>
              <div className="text-sm text-gray-500">Total Feedback</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {feedbackList.filter(f => f.score !== null && f.score !== undefined).length}
              </div>
              <div className="text-sm text-gray-500">Graded Assessments</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">
                {[...new Set(feedbackList.map(f => f.subject).filter(Boolean))].length}
              </div>
              <div className="text-sm text-gray-500">Different Subjects</div>
            </div>
          </div>
        )}

        {/* View Feedback Modal */}
        {selectedFeedback && (
          <ViewFeedbackModal
            isOpen={!!selectedFeedback}
            onClose={() => setSelectedFeedback(null)}
            feedback={selectedFeedback}
          />
        )}

        {/* Reply */}
        {replyTarget && (
          <ReplyMessageModal
            isOpen={!!replyTarget}
            onClose={() => setReplyTarget(null)}
            original={replyTarget}
            onSent={() => {
              setReplyTarget(null)
            }}
          />
        )}
      </main>
    </>
  )
}

export default ParentStudentFeedbackPage