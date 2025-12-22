// File: src/app/(user)/classes/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ClassViewModal from '@/components/classes/view/classViewModal'
import ClassAddModal from '@/components/classes/add/classAddModal'
import ClassDeleteModal from '@/components/classes/delete/classDeleteModal'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { ClassPayload } from '@/services/types/class'
import { getAllClasses, getClassesByTeacherId } from '@/services/classService'
import { getTermsBySchool } from '@/services/termService'
import { TermPayload } from '@/services/types/term'
import { PlusIcon, AcademicCapIcon, EyeIcon, PencilSquareIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { getGradeOptions } from '@/lib/schoolUtils'

const ClassesPage = () => {
  const user = useUserStore((state) => state.user)
  
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [termFilter, setTermFilter] = useState<string>('active')
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set())
  const [viewClass, setViewClass] = useState<ClassPayload | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ClassPayload | null>(null)

  const loadClasses = useCallback(async () => {
    if (!user.school || !user.id) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      if (user.role === 'ADMIN') {
        response = await getAllClasses(user.school);
      } else {
        response = await getClassesByTeacherId(user.id);
      }

      if (response.status === 'success') {
        setClasses(response.data);
      } else {
        setError(response.message || 'Failed to load classes');
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Error loading classes');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.role, user.school]);

  const loadTerms = useCallback(async () => {
    if (!user.school) return;

    try {
      const response = await getTermsBySchool(user.school);
      if (response.status === 'success') {
        setTerms(response.data);
      }
    } catch (err) {
      console.error('Error loading terms:', err);
    }
  }, [user.school]);

  useEffect(() => {
    loadClasses();
    loadTerms();
  }, [user.school, user.id, user.role, loadClasses, loadTerms])

  // Build unique grade list
  const availableGrades = getGradeOptions()

  // Get active term for default filtering
  const activeTerm = terms.find(t => t.isActive);
  
  // Filter classes by search, grade, AND term
  const filteredClasses = classes.filter((c) => {
    const lower = searchTerm.toLowerCase()
    const matchesText =
      c.subject.toLowerCase().includes(lower) ||
      c.teacherName.toLowerCase().includes(lower)
    const matchesGrade =
      gradeFilter === '' || String(c.grade) === gradeFilter
    
    let matchesTerm = true;
    if (termFilter === 'active') {
      matchesTerm = activeTerm ? c.termName === activeTerm.name : true;
    } else if (termFilter === 'all') {
      matchesTerm = true;
    } else {
      matchesTerm = c.termName === termFilter;
    }
    
    return matchesText && matchesGrade && matchesTerm
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
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Classes</h1>
                <p className="text-slate-500 mt-1">Manage class schedules and assignments</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl font-medium cursor-pointer"
              >
                <PlusIcon className="h-5 w-5" />
                Add Class
              </button>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Sticky Header */}
            <div className="sticky top-20 z-10 bg-white rounded-t-2xl border-b border-slate-100">
              <div className="p-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Search Classes
                    </label>
                    <input
                      type="text"
                      placeholder="Search by subject or teacher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 placeholder:text-slate-400"
                    />
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
                </div>

                {(searchTerm || gradeFilter || termFilter !== 'active') && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      Showing {filteredClasses.length} of {classes.length} classes
                    </span>
                    <button
                      onClick={() => {
                        setSearchTerm('')
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
                    <AcademicCapIcon className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-red-600">{error}</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <AcademicCapIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {classes.length === 0 ? 'No Classes Yet' : 'No Matching Classes'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {classes.length === 0
                      ? 'Add your first class to get started.'
                      : 'Try adjusting your search or filters.'}
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
                          className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl cursor-pointer select-none hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
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
                              <div
                                key={cls.classId}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                    <AcademicCapIcon className="w-5 h-5 text-cyan-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {cls.subject}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                      {cls.teacherName || 'No teacher assigned'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="hidden sm:inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium">
                                    {cls.termName || 'No term'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setViewClass(cls)}
                                      className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="View Class"
                                    >
                                      <EyeIcon className="h-5 w-5" />
                                    </button>
                                    <Link
                                      href={`/classes/${cls.classId}/edit`}
                                      className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                      title="Edit Class"
                                    >
                                      <PencilSquareIcon className="h-5 w-5" />
                                    </Link>
                                    <button
                                      onClick={() => setDeleteTarget(cls)}
                                      className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Delete Class"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
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

      {/* Custom scrollbar styling */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* Class View Modal */}
      {viewClass && (
        <ClassViewModal
          isOpen={!!viewClass}
          onClose={() => setViewClass(null)}
          classData={viewClass}
        />
      )}

      {/* Class Add Modal */}
      {showAddModal && (
        <ClassAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={() => loadClasses()}
        />
      )}

      {/* Class Delete Modal */}
      {deleteTarget && (
        <ClassDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          classData={deleteTarget}
          onDeleted={() => loadClasses()}
        />
      )}
    </>
  )
}

export default ClassesPage
