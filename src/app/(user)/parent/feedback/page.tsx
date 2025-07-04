'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import Spinner from '@/components/Spinner'
import Link from 'next/link'

const ParentFeedbackPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const [children, setChildren] = useState<ParentStudentPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user.id) return
    setLoading(true)
    getStudentsByParentId(user.id)
      .then((res) => {
        setChildren(res.data || [])
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load student feedback data.')
      })
      .finally(() => setLoading(false))
  }, [user.id])

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Student Feedback</h1>
          <p className="text-gray-600 mt-2">View assessments and comments shared by teachers.</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 font-medium">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {children.length === 0 ? (
              <div className="text-center text-gray-500">No children linked to your account yet.</div>
            ) : (
              children.map((child) => (
                <div
                  key={child.studentId}
                  className="bg-white rounded-xl shadow p-5 flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{child.student?.name}</h2>
                    <p className="text-sm text-gray-600">Grade: {child.student?.grade ?? 'N/A'}</p>
                  </div>
                  <Link
                    href={`/parent/feedback/${child.studentId}`}
                    className="mt-4 md:mt-0 px-4 py-2 bg-blue-400 text-white rounded-lg text-sm hover:bg-blue-500"
                  >
                    View Student Assessments & Feedback
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default ParentFeedbackPage
