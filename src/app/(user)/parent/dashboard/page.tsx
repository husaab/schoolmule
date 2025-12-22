'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import Spinner from '@/components/Spinner'
import ParentChildCard from '@/components/parent/card/ParentChildCard'
import StaffList from '@/components/staff/StaffList'
import { HomeIcon, ChatBubbleLeftRightIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

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
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Parent Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back! View updates for your children below.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                <HomeIcon className="w-5 h-5 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">Parent Portal</span>
              </div>
            </div>
          </div>

          {/* Communication Card */}
          <Link
            href="/parent/communication"
            className="group block bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 hover:shadow-lg hover:border-slate-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">Communication</h2>
                  <p className="text-sm text-slate-500">View messages or announcements from the school</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl text-sm font-medium group-hover:from-cyan-600 group-hover:to-teal-600 transition-all">
                View Messages
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Loading/Error */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          )}
          {error && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <UserGroupIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Children Cards List */}
          {!loading && !error && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Children</h2>
              {children.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Children Linked</h3>
                  <p className="text-sm text-slate-500">No children linked to your account yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children.map((childLink) => (
                    <ParentChildCard key={childLink.studentId} childLink={childLink} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Staff Directory */}
          {!loading && !error && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">School Staff Directory</h2>
              <p className="text-sm text-slate-500 mb-6">Contact information for school staff members.</p>
              <StaffList school={user.school!} showContactInfo={true} showActions={true} />
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default ParentDashboardPage
