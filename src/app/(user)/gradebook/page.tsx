// File: src/app/(user)/gradebook/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getClassesByTeacherId, getAllClasses } from '@/services/classService'
import { getTermsBySchool } from '@/services/termService'
import type { ClassPayload } from '@/services/types/class'
import type { TermPayload } from '@/services/types/term'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GradebookDashboard: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const router = useRouter()

  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [termFilter, setTermFilter] = useState<string>('active')
  const [collapsedGrades, setCollapsedGrades] = useState<Set<number>>(new Set())

  // 1) Fetch all classes taught by this teacher
  useEffect(() => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
     if (user.school) {
          if(user.role === 'ADMIN') {
            getAllClasses(user.school)
            .then((res) => {
              if (res.status === 'success') {
                setClasses(res.data)
              } else {
                console.error('Failed to fetch classes:', res.message)
              }
            })
            .catch((err) => {
              console.error('Error loading classes:', err)
            })
          } else{
            getClassesByTeacherId(user.id)
            .then((res) => {
              if (res.status === 'success') {
                setClasses(res.data)
              } else {
                setError(res.message || 'Failed to load your classes')
              }
            })
            .catch((err) => {
              console.error('Error loading classes:', err)
            })
          }
        }
        setLoading(false);

    // Load terms for the school
    if (user.school) {
      getTermsBySchool(user.school)
        .then((res) => {
          if (res.status === 'success') {
            setTerms(res.data);
          }
        })
        .catch((err) => {
          console.error('Error loading terms:', err);
        });
    }
  }, [user?.id, user?.school])

  // Build the unique list of grades for the classes this teacher teaches
  const availableGrades = Array.from(
    new Set(
      classes
        .map((c) => c.grade)
        .filter((g): g is number => g != null && !isNaN(g))
        .map((g) => Number(g))
    )
  )
    .filter((g) => g >= 1 && g <= 8)
    .sort((a, b) => a - b)

  // Get active term for default filtering
  const activeTerm = terms.find(t => t.isActive);
  
  // Filter by grade and term
  const filteredClasses = classes.filter((c) => {
    const matchesGrade = gradeFilter === '' || String(c.grade) === gradeFilter
    
    let matchesTerm = true;
    if (termFilter === 'active') {
      matchesTerm = activeTerm ? c.termName === activeTerm.name : true;
    } else if (termFilter === 'all') {
      matchesTerm = true;
    } else {
      matchesTerm = c.termName === termFilter;
    }
    
    return matchesGrade && matchesTerm
  })

  const toggleGrade = (grade: number) => {
    setCollapsedGrades((prev) => {
      const next = new Set(prev)
      if (next.has(grade)) next.delete(grade)
      else next.add(grade)
      return next
    })
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Gradebook</h1>
          <p className="text-gray-600 mt-2">Select one of your classes below to enter marks</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Class Gradebooks</h2>
                  <p className="text-sm text-gray-600">Access gradebooks for your classes</p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Term
                  </label>
                  <select
                    value={termFilter}
                    onChange={(e) => setTermFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="active">Active Term ({activeTerm?.name})</option>
                    <option value="all">All Terms</option>
                    {terms.map((term) => (
                      <option key={term.termId} value={term.name}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Grade
                  </label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="">All Grades</option>
                    {availableGrades.map((g) => (
                      <option key={g} value={String(g)}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(gradeFilter || termFilter !== 'active') && (
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Showing {filteredClasses.length} of {classes.length} classes
                  </span>
                  <button
                    onClick={() => {
                      setGradeFilter('')
                      setTermFilter('active')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Classes Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-center text-gray-600">Loading your classes…</div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : !loading && !error && availableGrades.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                You haven't been assigned any classes yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Collapsible grade sections */}
                {availableGrades.map((g) => {
                  const classesForGrade = filteredClasses.filter(
                    (c) => Number(c.grade) === g
                  )
                  if (classesForGrade.length === 0) return null

                  const isCollapsed = collapsedGrades.has(g)

                  return (
                    <div key={g} className="space-y-2">
                      {/* Grade header */}
                      <div
                        onClick={() => toggleGrade(g)}
                        className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer select-none"
                      >
                        <span className="font-semibold text-lg">Grade {g}</span>
                        <svg
                          className={`w-5 h-5 transform transition-transform duration-200 ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {/* Class cards */}
                      {!isCollapsed &&
                        classesForGrade.map((cls) => (
                          <div
                            key={cls.classId}
                            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {cls.subject}
                              </p>
                              <p className="text-gray-600 text-sm">
                                Teacher: {cls.teacherName || '-'}
                              </p>
                              <p className="text-gray-500 text-xs">
                                Term: {cls.termName || 'Not assigned'}
                              </p>
                              <p className="text-gray-600 text-sm">
                                Class ID: {cls.classId.slice(0, 8)}…{/* truncated */}
                              </p>
                            </div>

                            <div className="flex items-center space-x-4">
                              {/* "Open Gradebook" → navigate into detailed gradebook page */}
                              <Link
                                href={`/gradebook/${cls.classId}`}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer"
                              >
                                Open Gradebook
                              </Link>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default GradebookDashboard