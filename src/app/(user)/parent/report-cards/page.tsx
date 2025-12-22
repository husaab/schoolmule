'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import Spinner from '@/components/Spinner'
import { DocumentTextIcon, UserCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const ParentReportCardsPage: React.FC = () => {
  const router = useRouter()
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
        setError('Failed to load child data.')
      })
      .finally(() => setLoading(false))
  }, [user.id])

  const handleViewReportCards = (studentId: string) => {
    router.push(`/parent/report-cards/${studentId}`)
  }

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
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Report Cards</h1>
                <p className="text-slate-500 mt-1">View and download report cards for your children</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Report Cards</span>
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
                <DocumentTextIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Main Content Card */}
          {!loading && !error && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Your Children&apos;s Report Cards</h2>
                    <p className="text-sm text-slate-500">Select a child to view their report cards</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {children.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Children Found</h3>
                    <p className="text-sm text-slate-500">No children are linked to your account yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map((childLink) => (
                      <div
                        key={childLink.studentId}
                        onClick={() => handleViewReportCards(childLink.studentId)}
                        className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                            <UserCircleIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">
                              {childLink!.student!.name}
                            </h3>
                            <p className="text-sm text-slate-500">Grade {childLink!.student!.grade}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl text-sm font-medium group-hover:from-cyan-600 group-hover:to-teal-600 transition-all">
                          View Report Cards
                          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
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

export default ParentReportCardsPage