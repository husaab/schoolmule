'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import Spinner from '@/components/Spinner'
import ParentChildCard from '@/components/parent/card/ParentChildCard'

const ParentDashboardPage: React.FC = () => {
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

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Parent Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your dashboard. View updates for your children below.</p>
        </div>

        {/* Communication Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Communication</h2>
              <p className="text-sm text-gray-600">View messages or announcements from the school.</p>
            </div>
            <a
              href="/parent/communication"
              className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
            >
              Go to Communication
            </a>
          </div>
        </div>

        {/* Loading/Error */}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 font-medium">{error}</div>
        )}

        {/* Children Cards List */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
            {children.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No children linked to your account yet.
              </div>
            ) : (
              children.map((childLink) => (
                <ParentChildCard key={childLink.studentId} childLink={childLink} />
              ))
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default ParentDashboardPage
