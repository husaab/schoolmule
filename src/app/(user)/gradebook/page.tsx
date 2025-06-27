// File: src/app/(user)/gradebook/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getClassesByTeacherId, getAllClasses } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GradebookDashboard: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const router = useRouter()

  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string>('')   // optional: filter dropdown
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
  }, [user?.id])

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

  // Optionally filter by specific grade (if dropdown used)
  const filteredClasses = classes.filter((c) => {
    const matchesGrade = gradeFilter === '' || String(c.grade) === gradeFilter
    return matchesGrade
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

      <main className="lg:ml-64 bg-white min-h-screen p-4 lg:p-10">
        <div className="pt-40 text-center text-black mb-8">
          <h1 className="text-3xl font-semibold">Gradebook</h1>
          <p className="text-gray-600 mt-2">
            Select one of your classes below to enter marks
          </p>
        </div>

        <div className="w-[85%] lg:w-[75%] mx-auto space-y-6">
          {/* Optional “Grade Filter” dropdown */}
          <div className="flex justify-end mb-4">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">All Grades</option>
              {availableGrades.map((g) => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          {/* Show loading / error states */}
          {loading && (
            <p className="text-center text-gray-600">Loading your classes…</p>
          )}
          {error && <p className="text-center text-red-600">{error}</p>}

          {!loading && !error && availableGrades.length === 0 && (
            <p className="text-center text-gray-600">
              You haven’t been assigned any classes yet.
            </p>
          )}

          {/* Collapsible sections per grade */}
          {availableGrades.map((g) => {
            // Only show classes for this grade and after filtering
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
                      className="flex items-center justify-between px-4 py-3 bg-white border border-cyan-400 rounded-lg shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {cls.subject}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Teacher: {cls.teacherName || '-'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Class ID: {cls.classId.slice(0, 8)}…{/* truncated */}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* “Open Gradebook” → navigate into detailed gradebook page */}
                        <Link
                        href={`/gradebook/${cls.classId}`}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                      >
                        Open
                      </Link>

                        {/* You could add “Export CSV” here once you implement that */}
                      </div>
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      </main>

      {/* Scrollbar styling (optional) */}
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
    </>
  )
}

export default GradebookDashboard
