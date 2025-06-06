// File: src/app/(user)/classes/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ClassViewModal from '@/components/classes/view/classViewModal'
import ClassAddModal from '@/components/classes/add/classAddModal'
import ClassDeleteModal from '@/components/classes/delete/classDeleteModal'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { ClassPayload } from '@/services/types/class'
import { getAllClasses } from '@/services/classService'

const ClassesPage = () => {
  const user = useUserStore((state) => state.user)
  const router = useRouter()
  
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [collapsedGrades, setCollapsedGrades] = useState<Set<number>>(new Set())
  const [viewClass, setViewClass] = useState<ClassPayload | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ClassPayload | null>(null)

  useEffect(() => {
    if (user.school) {
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
    }
  }, [user.school])

  // Build unique grade list
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

  // Filter classes by search AND grade
  const filteredClasses = classes.filter((c) => {
    const lower = searchTerm.toLowerCase()
    const matchesText =
      c.subject.toLowerCase().includes(lower) ||
      c.teacherName.toLowerCase().includes(lower)
    const matchesGrade =
      gradeFilter === '' || String(c.grade) === gradeFilter
    return matchesText && matchesGrade
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
      <main className="ml-32 bg-white min-h-screen p-10">
        <div className="py-40 p-50 text-black">
          <h1 className="text-3xl text-center">Classes</h1>

          <div className="mt-10 p-8 w-[70%] max-h-[80vh] sm:w-12/12 md:w-11/12 lg:w-10/12 mx-auto overflow-y-scroll custom-scrollbar border-2 border-cyan-600 rounded-lg shadow-lg space-y-4">
            {/* Controls: Search, Grade Filter, Add Class */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              {/* Search */}
              <input
                type="text"
                placeholder="Search by subject or teacher…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />

              {/* Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">All Grades</option>
                {availableGrades.map((g) => (
                  <option key={g} value={String(g)}>
                    Grade {g}
                  </option>
                ))}
              </select>

              {/* + Add Class */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-500 cursor-pointer"
              >
                + Add Class
              </button>
            </div>

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
                        className="flex items-center justify-between p-4 bg-white border border-cyan-400 rounded-lg shadow-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {cls.subject}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Teacher: {cls.teacherName || '-'}
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
          onAdd={(newClass) => setClasses((prev) => [newClass, ...prev])}
        />
      )}

      {/* Class Delete Modal */}
      {deleteTarget && (
        <ClassDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          classData={deleteTarget}
          onDeleted={(id) =>
            setClasses((prev) => prev.filter((c) => c.classId !== id))
          }
        />
      )}
    </>
  )
}

export default ClassesPage
