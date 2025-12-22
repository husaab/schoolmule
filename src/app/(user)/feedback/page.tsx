'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { getGradeNumericValue } from '@/lib/schoolUtils'

const ViewEditFeedbackPage: React.FC = () => {
  const user = useUserStore(s => s.user)
  const teacherId = user.id!

  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [feedbackList, setFeedbackList] = useState<FeedbackPayload[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedGradeSubject, setSelectedGradeSubject] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState<FeedbackPayload | null>(null)
  const [editModalOpen, setEditModalOpen] = useState<FeedbackPayload | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState<FeedbackPayload | null>(null)

  // Load data

   const loadData = useCallback(async () => {
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
    }, [teacherId])

  useEffect(() => {
    loadData()
  }, [teacherId, loadData])

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
      if (a.grade !== b.grade) {
        const gradeA = getGradeNumericValue(a.grade)
        const gradeB = getGradeNumericValue(b.grade)
        return gradeA - gradeB
      }
      return a.subject.localeCompare(b.subject)
    })
  }, [classes])

  // Get unique students from feedback
  const availableStudents = useMemo(() => {
    const students = feedbackList.map(fb => ({
      id: fb.recipientId,
      name: fb.recipientName || 'Unknown Student'
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
        const targetSubject = selectedOption.subject.toLowerCase()
        filtered = filtered.filter(fb => {
          // Check both subject and courseName fields for matches
          const fbSubject = (fb.subject || '').toLowerCase()
          const fbCourseName = (fb.courseName || '').toLowerCase()
          return fbSubject === targetSubject || fbCourseName === targetSubject
        })
      }
    }

    // Filter by student
    if (selectedStudent) {
      filtered = filtered.filter(fb => {
        const recipientId = fb.recipientId
        return recipientId === selectedStudent
      })
    }

    // Filter by search term (subject, body, student name, course name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(fb => {
        const subject = (fb.subject || '').toLowerCase()
        const body = (fb.body || '').toLowerCase()
        const studentName = (fb.recipientName || '').toLowerCase()
        const assessmentName = (fb.assessmentName || '').toLowerCase()
        const courseName = (fb.courseName || '').toLowerCase()
        
        return subject.includes(term) || 
               body.includes(term) || 
               studentName.includes(term) ||
               assessmentName.includes(term) ||
               courseName.includes(term)
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
  }, [feedbackList, selectedGradeSubject, selectedStudent, searchTerm, availableGradeSubjects])

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">View & Edit Feedback</h1>
                <p className="text-slate-500 mt-1">Manage feedback sent to students and parents</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <EyeIcon className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">{filteredFeedback.length} Feedback Items</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Sticky Filters */}
            <div className="sticky top-20 z-10 bg-white rounded-t-2xl border-b border-slate-100">
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search feedback..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Grade & Subject</label>
                    <select
                      value={selectedGradeSubject}
                      onChange={(e) => setSelectedGradeSubject(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer"
                    >
                      <option value="">All Classes</option>
                      {availableGradeSubjects.map(gs => (
                        <option key={gs.value} value={gs.value}>{gs.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer"
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
                      className="w-full px-4 py-2.5 text-sm bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {(searchTerm || selectedGradeSubject || selectedStudent) && (
                  <div className="mt-4 text-sm text-slate-500">
                    Showing {filteredFeedback.length} of {feedbackList.length} feedback items
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Table */}
            <div className="p-6">
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <EyeIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Feedback Found</h3>
                  <p className="text-sm text-slate-500">
                    {feedbackList.length === 0 ? 'You haven\'t sent any feedback yet.' : 'No feedback matches your filters.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                          Parent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                          Course
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                          Assessment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                          Weight
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredFeedback.map((feedback, index) => {
                        const createdAt = feedback.createdAt
                        const studentName = feedback.studentName || 'Unknown Student'
                        const parentName = feedback.recipientName || 'Unknown Parent'
                        const assessmentName = feedback.assessmentName
                        const score = feedback.score
                        const weightPercentage = feedback.weightPercentage

                        return (
                          <tr key={feedback.feedbackId || index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">{studentName}</div>
                              <div className="text-xs text-slate-500 md:hidden space-y-0.5">
                                <div>Parent: {parentName}</div>
                                {feedback.subject && <div>Subject: {feedback.subject}</div>}
                                {feedback.courseName && <div>Course: {feedback.courseName}</div>}
                                <div>Date: {new Date(createdAt).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                              {parentName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                              {feedback.subject || '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                              {feedback.courseName || '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">
                              {assessmentName || '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                              {score !== null && score !== undefined ? (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                                  score >= 60 ? 'bg-amber-50 text-amber-700' :
                                  'bg-red-50 text-red-700'
                                }`}>
                                  {score}/100
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">
                              {weightPercentage ? `${weightPercentage}%` : '—'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 hidden sm:table-cell">
                              {new Date(createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setViewModalOpen(feedback)}
                                  className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="View"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => setEditModalOpen(feedback)}
                                  className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => setDeleteModalOpen(feedback)}
                                  className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
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
          </div>
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