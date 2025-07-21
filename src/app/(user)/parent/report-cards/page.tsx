'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import Spinner from '@/components/Spinner'
import { DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline'

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
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Report Cards</h1>
          <p className="text-gray-600 mt-2">View and download report cards for your children</p>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 font-medium bg-red-50 p-4 rounded-lg max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Main Content Card */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl shadow-md max-w-4xl mx-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-cyan-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Your Children's Report Cards</h2>
                  <p className="text-sm text-gray-600">Select a child to view their report cards</p>
                </div>
              </div>
            </div>

            {/* Children List */}
            <div className="p-6">
              {children.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-800">No children found</p>
                  <p className="text-sm text-gray-600">No children are linked to your account yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((childLink) => (
                    <div
                      key={childLink.studentId}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{childLink!.student!.name}</h3>
                        <p className="text-sm text-gray-600">Grade {childLink!.student!.grade}</p>
                      </div>
                      
                      <button
                        onClick={() => handleViewReportCards(childLink.studentId)}
                        className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View Report Cards</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default ParentReportCardsPage