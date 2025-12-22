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
import Link from 'next/link'
import { getGradeOptions } from '@/lib/schoolUtils'
import { BookOpenIcon, AcademicCapIcon, ChevronDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'

const GradebookDashboard: React.FC = () => {
  const user = useUserStore((state) => state.user)

  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [termFilter, setTermFilter] = useState<string>('active')
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set())

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
  }, [user?.id, user?.school, user.role])

  // Build the unique list of grades for the classes this teacher teaches
  const availableGrades = getGradeOptions()

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

  const toggleGrade = (grade: string) => {
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
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Gradebook</h1>
                <p className="text-slate-500 mt-1">Select a class to enter and manage grades</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <BookOpenIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">{filteredClasses.length} Classes</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Sticky Header */}
            <div className="sticky top-20 z-10 bg-white rounded-t-2xl border-b border-slate-100">
              <div className="p-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Filter by Term
                    </label>
                    <select
                      value={termFilter}
                      onChange={(e) => setTermFilter(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer"
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Filter by Grade
                    </label>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer"
                    >
                      <option value="">All Grades</option>
                      {availableGrades.map((gradeOption) => (
                        <option key={gradeOption.value} value={String(gradeOption.value)}>
                          Grade {gradeOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(gradeFilter || termFilter !== 'active') && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      Showing {filteredClasses.length} of {classes.length} classes
                    </span>
                    <button
                      onClick={() => {
                        setGradeFilter('')
                        setTermFilter('active')
                      }}
                      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Classes Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-red-600">{error}</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Classes Found</h3>
                  <p className="text-sm text-slate-500">
                    {classes.length === 0
                      ? "You haven't been assigned any classes yet."
                      : 'Try adjusting your filters.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Collapsible grade sections */}
                  {availableGrades.map((gradeOption) => {
                    const classesForGrade = filteredClasses.filter(
                      (c) => String(c.grade) === String(gradeOption.value)
                    )
                    if (classesForGrade.length === 0) return null

                    const isCollapsed = collapsedGrades.has(String(gradeOption.value))

                    return (
                      <div key={gradeOption.value} className="space-y-2">
                        {/* Grade header */}
                        <button
                          onClick={() => toggleGrade(String(gradeOption.value))}
                          className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl cursor-pointer select-none hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                              <AcademicCapIcon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-lg">Grade {gradeOption.label}</span>
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                              {classesForGrade.length} {classesForGrade.length === 1 ? 'class' : 'classes'}
                            </span>
                          </div>
                          <ChevronDownIcon
                            className={`w-5 h-5 transform transition-transform duration-200 ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </button>

                        {/* Class cards */}
                        {!isCollapsed && (
                          <div className="space-y-2 pl-2">
                            {classesForGrade.map((cls) => (
                              <Link
                                key={cls.classId}
                                href={`/gradebook/${cls.classId}`}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                    <BookOpenIcon className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                                      {cls.subject}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                      {cls.teacherName || 'No teacher assigned'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="hidden sm:inline-flex px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium">
                                    {cls.termName || 'No term'}
                                  </span>
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium group-hover:bg-emerald-600 transition-colors">
                                    Open
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default GradebookDashboard