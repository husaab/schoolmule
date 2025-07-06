'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import { useUserStore } from '@/store/useUserStore'
import { getClassesByTeacherId } from '@/services/classService'
import { getSentFeedback } from '@/services/feedbackService'
import { ClassPayload } from '@/services/types/class'
import { FeedbackPayload } from '@/services/types/feedback'
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import ViewFeedbackModal from '@/components/feedback/view/ViewFeedbackModal'
import EditFeedbackModal from '@/components/feedback/edit/EditFeedbackModal'
import DeleteFeedbackModal from '@/components/feedback/delete/DeleteFeedbackModal'

const ViewEditFeedbackPage: React.FC = () => {
  const user = useUserStore(s => s.user)
  const teacherId = user.id!

  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedGradeSubject, setSelectedGradeSubject] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState<any>(null)
  const [editModalOpen, setEditModalOpen] = useState<any>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState<any>(null)

  // Load data
  const loadData = async () => {
    if (!teacherId) return
    setLoading(true)
    try {
      const [clsRes, fbRes] = await Promise.all([
        getClassesByTeacherId(teacherId),
        getSentFeedback(teacherId)
      ])
      if (clsRes.status === 'success') setClasses(clsRes.data)
      if (fbRes.status === 'success') {
        setFeedbackList(fbRes.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [teacherId])

  const reloadFeedback = () => {
    loadData()
  }

  // Get unique grade-subject combinations from classes
  const availableGradeSubjects = useMemo(() => {
    const gradeSubjects = classes.map(c => ({
      value: `${c.grade}-${c.subject}`,
      label: `Grade ${c.grade} - ${c.subject}`,
      grade: c.grade,
      subject: c.subject
    }))
    
    // Remove duplicates based on value
    const unique = gradeSubjects.filter((item, index, self) => 
      index === self.findIndex(t => t.value === item.value)
    )
    
    // Sort by grade first, then by subject
    return unique.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade
      return a.subject.localeCompare(b.subject)
    })
  }, [classes])

  // Get unique students from feedback
  const availableStudents = useMemo(() => {
    const students = feedbackList.map(fb => ({
      id: fb.recipientId || fb.recipient_id,
      name: fb.recipientName || fb.recipient_name || 'Unknown Student'
    }))
    const uniqueStudents = students.filter((student, index, self) => 
      student.id && index === self.findIndex(s => s.id === student.id)
    )
    return uniqueStudents.sort((a, b) => a.name.localeCompare(b.name))
  }, [feedbackList])

  // Filter feedback based on selected filters
  const filteredFeedback = useMemo(() => {
    let filtered = [...feedbackList]

    // Filter by grade-subject combination
    if (selectedGradeSubject) {
      const selectedOption = availableGradeSubjects.find(gs => gs.value === selectedGradeSubject)
      
      if (selectedOption) {
        filtered = filtered.filter(fb => {
          const courseName = (fb.courseName || fb.course_name || '').toLowerCase()
          const targetSubject = selectedOption.subject.toLowerCase()
          
          // Match course name with the selected subject
          return courseName.includes(targetSubject) || targetSubject.includes(courseName)
        })
      }
    }

    // Filter by student
    if (selectedStudent) {
      filtered = filtered.filter(fb => {
        const recipientId = fb.recipientId || fb.recipient_id
        return recipientId === selectedStudent
      })
    }

    // Filter by search term (subject, body, student name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(fb => {
        const subject = (fb.subject || '').toLowerCase()
        const body = (fb.body || '').toLowerCase()
        const studentName = (fb.recipientName || fb.recipient_name || '').toLowerCase()
        const assessmentName = (fb.assessmentName || fb.assessment_name || '').toLowerCase()
        
        return subject.includes(term) || 
               body.includes(term) || 
               studentName.includes(term) ||
               assessmentName.includes(term)
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at)
      const dateB = new Date(b.createdAt || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })
  }, [feedbackList, selectedGradeSubject, selectedStudent, searchTerm, availableGradeSubjects])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">View & Edit Feedback</h1>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 text-black">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search feedback..."
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade & Subject</label>
                <select
                  value={selectedGradeSubject}
                  onChange={(e) => setSelectedGradeSubject(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Classes</option>
                  {availableGradeSubjects.map(gs => (
                    <option key={gs.value} value={gs.value}>{gs.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Students</option>
                  {availableStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedGradeSubject('')
                    setSelectedStudent('')
                    setSearchTerm('')
                  }}
                  className="w-full px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredFeedback.length} of {feedbackList.length} feedback items
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {feedbackList.length === 0 ? 'No feedback found' : 'No feedback matches your filters'}
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[80vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Subject
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Assessment
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Score
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedback.map((feedback, index) => {
                    const createdAt = feedback.createdAt || feedback.created_at
                    const recipientName = feedback.recipientName || feedback.recipient_name || 'Unknown Student'
                    const assessmentName = feedback.assessmentName || feedback.assessment_name
                    const score = feedback.score
                    const weightPercentage = feedback.weightPercentage || feedback.weight_percentage
                    
                    return (
                      <tr key={feedback.feedbackId || feedback.feedback_id || index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{recipientName}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {feedback.subject && <div>Subject: {feedback.subject}</div>}
                            <div>Date: {new Date(createdAt).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {feedback.subject || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {assessmentName || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {score ? `${score}/${weightPercentage}%` : '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {new Date(createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewModalOpen(feedback)}
                              className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                              title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditModalOpen(feedback)}
                              className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setDeleteModalOpen(feedback)}
                              className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        {viewModalOpen && (
          <ViewFeedbackModal
            isOpen={!!viewModalOpen}
            onClose={() => setViewModalOpen(null)}
            feedback={viewModalOpen}
          />
        )}
        
        {editModalOpen && (
          <EditFeedbackModal
            isOpen={!!editModalOpen}
            onClose={() => setEditModalOpen(null)}
            feedback={editModalOpen}
            onUpdated={reloadFeedback}
          />
        )}
        
        {deleteModalOpen && (
          <DeleteFeedbackModal
            isOpen={!!deleteModalOpen}
            onClose={() => setDeleteModalOpen(null)}
            feedback={deleteModalOpen}
            onDeleted={reloadFeedback}
          />
        )}
      </main>
    </>
  )
}

export default ViewEditFeedbackPage