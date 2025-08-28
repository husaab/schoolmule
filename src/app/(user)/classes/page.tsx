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
import { PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
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
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Classes Management</h1>
          <p className="text-gray-600 mt-2">Manage class schedules and assignments for your school.</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Class Directory</h2>
                  <p className="text-sm text-gray-600">View and manage all class schedules</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Class
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Classes
                  </label>
                  <input
                    type="text"
                    placeholder="Search by subject or teacher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
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
                    {availableGrades.map((gradeOption) => (
                      <option key={gradeOption.value} value={String(gradeOption.value)}>
                        Grade {gradeOption.label}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>
              
              {(searchTerm || gradeFilter || termFilter !== 'active') && (
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Showing {filteredClasses.length} of {classes.length} classes
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm('')
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
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">
                {error}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {classes.length === 0 ? 'No Classes' : 'No Matching Classes'}
                </h3>
                <p className="text-sm text-gray-500">
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
                  <div
                    onClick={() => toggleGrade(String(gradeOption.value))}
                    className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer select-none"
                  >
                    <span className="font-semibold text-lg">Grade {gradeOption.label}</span>
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
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setViewClass(cls)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                          >
                            View
                          </button>
                          <Link
                            href={`/classes/${cls.classId}/edit`}
                            className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer inline-block text-center"
                          >
                            Edit
                          </Link>
                          {/* Delete “×” button */}
                          <button
                            onClick={() => setDeleteTarget(cls)}
                            className="text-2xl text-red-600 hover:text-red-800 font-bold px-2 cursor-pointer"
                          >
                            ×
                          </button>
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
