'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { ChatBubbleBottomCenterTextIcon, UserCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const ParentFeedbackPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [children, setChildren] = useState<ParentStudentPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle old URL format with query parameters
  useEffect(() => {
    const studentId = searchParams.get('studentId')
    if (studentId) {
      // Redirect to new URL format
      router.replace(`/parent/feedback/${studentId}`)
      return
    }
  }, [searchParams, router])

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
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Student Feedback</h1>
                <p className="text-slate-500 mt-1">View assessments and comments shared by teachers</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Feedback</span>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Children List */}
          {!loading && !error && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Select a Child</h2>
                <p className="text-sm text-slate-500">View feedback for your children</p>
              </div>

              <div className="p-6">
                {children.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Children Linked</h3>
                    <p className="text-sm text-slate-500">No children linked to your account yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map((child) => (
                      <Link
                        key={child.studentId}
                        href={`/parent/feedback/${child.studentId}`}
                        className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                            <UserCircleIcon className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">
                              {child.student?.name}
                            </h3>
                            <p className="text-sm text-slate-500">Grade {child.student?.grade ?? 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl text-sm font-medium group-hover:from-cyan-600 group-hover:to-teal-600 transition-all">
                          View Feedback
                          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default ParentFeedbackPage
