// src/app/teacher/feedback/page.tsx
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import { useUserStore } from '@/store/useUserStore'
import { getClassesByTeacherId, getStudentsInClass } from '@/services/classService'
import { getSentFeedback } from '@/services/feedbackService'
import { ClassPayload } from '@/services/types/class'
import { StudentPayload } from '@/services/types/student'
import { FeedbackPayload } from '@/services/types/feedback'
import SendFeedbackModal from '@/components/feedback/send/SendFeedbackModal'

const TeacherFeedbackPage: React.FC = () => {
  const user = useUserStore(s => s.user)
  const teacherId = user.id!

  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [feedbackList, setFeedbackList] = useState<FeedbackPayload[]>([])

  const [loading, setLoading] = useState(true)
  const [modalOpenFor, setModalOpenFor] = useState<string | null>(null) // studentId

  // fetch classes & sent feedback
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
        console.log('Feedback data:', fbRes.data)
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

  // fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)
    getStudentsInClass(selectedClass.classId)
      .then(res => {
        // assuming res.data is array of ParentStudentPayload
        setStudents(res.data)
      }).catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedClass])

  // compute last feedback per student for the current class/subject
  const lastFeedbackByStudent = useMemo(() => {
    const map: Record<string, FeedbackPayload> = {}
    
    if (!selectedClass) return map
    
    // Filter feedback for the current class/subject only
    const relevantFeedback = feedbackList.filter((fb: FeedbackPayload) => {
      const selectedSubject = selectedClass.subject.toLowerCase()
      return (fb.subject || '').toLowerCase() === selectedSubject
    })
    
    console.log('Computing last feedback for current class:', selectedClass.subject)
    console.log('Relevant feedback for this class:', relevantFeedback)
    
    relevantFeedback.forEach((fb: FeedbackPayload) => {
      // Check multiple possible student ID fields
      const studentId = fb.studentId
      
      // For student feedback, we should match by student_id field
      if (!studentId) {
        return
      }

      const timestamp = new Date(fb.createdAt)
      
      if (!map[studentId] || timestamp > new Date(map[studentId].createdAt)) {
        console.log('Setting latest feedback for student', studentId, 'Subject:', fb.subject, 'Date:', timestamp)
        map[studentId] = fb
      }
    })
    
    console.log('Final feedback mapping for', selectedClass.subject, ':', map)
    return map
  }, [feedbackList, selectedClass])

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Send Feedback</h1>
          <select
            value={selectedClass?.classId || ''}
            onChange={e => {
              const found = classes.find(c => c.classId === e.target.value)
              setSelectedClass(found || null)
            }}
            className="border rounded p-2 bg-white text-gray-800 text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="">Select Class...</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>
                Grade {c.grade} — {c.subject}
              </option>
            ))}
          </select>
        </div>

        {!selectedClass ? (
          <div className="text-center text-gray-600 mt-10 text-sm sm:text-base">
            Please select a class to view students.
          </div>
        ) : (
          <div className="overflow-x-auto text-black overflow-y-auto max-h-[80vh] -mx-4 sm:mx-0">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium">Student</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium hidden sm:table-cell">Last Feedback</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const lastFb = lastFeedbackByStudent[s.studentId]
                  return (
                    <tr key={s.studentId} className="border-b hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 text-sm sm:text-base">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-600 sm:hidden">
                          {lastFb
                            ? `${new Date(lastFb.createdAt).toLocaleDateString()}: ${lastFb.subject || 'No subject'}`
                            : 'No feedback sent'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                        {lastFb
                          ? `${new Date(lastFb.createdAt).toLocaleDateString()}: ${lastFb.subject || 'No subject'}`
                          : '—'}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <button
                          onClick={() => setModalOpenFor(s.studentId)}
                          className="px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
                        >
                          Send Feedback
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {modalOpenFor && selectedClass && (
          <SendFeedbackModal
            isOpen={!!modalOpenFor}
            onClose={() => setModalOpenFor(null)}
            student={students.find(s => s.studentId === modalOpenFor)!}
            teacherId={teacherId!}
            school={user.school!}
            onSent={() => {
              setModalOpenFor(null)
              reloadFeedback()
            }}
            assessmentsClassId={selectedClass.classId}
            courseName={selectedClass.subject}
          />
        )}
      </main>
    </>
  )
}

export default TeacherFeedbackPage
