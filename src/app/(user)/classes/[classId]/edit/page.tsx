// File: src/app/(user)/classes/[classId]/edit/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { getClassById } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import { getTermsBySchool, getTermByNameAndSchool } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'
import { isJK, isSK } from '@/lib/schoolUtils'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import Spinner from '@/components/Spinner'
import ClassDuplicateModal from '@/components/classes/duplicate/classDuplicateModal'
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

import ClassEditHeader from './_components/ClassEditHeader'
import SectionNav, { SectionNavItem } from './_components/SectionNav'
import ClassDetailsCard from './_components/ClassDetailsCard'
import TeachersCard from './_components/TeachersCard'
import StudentsCard from './_components/StudentsCard'
import AssessmentsSection from '@/components/assessments/section/AssessmentsSection'
import JKDomainsSection from './_components/jk/JKDomainsSection'
import SKSubjectsSection from './_components/sk/SKSubjectsSection'

export default function EditClassPage() {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const user = useUserStore((state) => state.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // ───── Class ─────
  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  // ───── Shared lookups (details + teachers cards) ─────
  const [teachers, setTeachers] = useState<TeacherPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [currentTermData, setCurrentTermData] = useState<TermPayload | null>(null)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingTerms, setLoadingTerms] = useState(false)

  const fetchClass = async () => {
    try {
      const res = await getClassById(classId)
      if (res.status === 'success') {
        setClassData(res.data)
      } else {
        setError(res.message || 'Failed to load class')
      }
    } catch (err) {
      console.error('Error fetching class:', err)
      setError('Error fetching class')
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchClass().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  // Current term details for display
  useEffect(() => {
    if (!classData?.termName || !classData?.school) return
    const fetchCurrentTermData = async () => {
      try {
        const res = await getTermByNameAndSchool(classData.termName, classData.school)
        if (res.status === 'success') {
          setCurrentTermData(res.data)
        }
      } catch (err) {
        console.error('Error fetching current term data:', err)
      }
    }
    fetchCurrentTermData()
  }, [classData?.termName, classData?.school])

  // Teachers + terms lookups
  useEffect(() => {
    if (!user.school) return

    const fetchTeachers = async () => {
      setLoadingTeachers(true)
      try {
        const res = await getTeachersBySchool(user.school!)
        if (res.status === 'success') {
          setTeachers(res.data)
        } else {
          console.error('Failed to fetch teachers:', res.message)
          showNotification('Failed to load teacher list', 'error')
        }
      } catch (err) {
        console.error('Error loading teachers:', err)
        showNotification('Error loading teacher list', 'error')
      } finally {
        setLoadingTeachers(false)
      }
    }

    const fetchTerms = async () => {
      setLoadingTerms(true)
      try {
        const res = await getTermsBySchool(user.school!)
        if (res.status === 'success') {
          setTerms(res.data)
        } else {
          showNotification('Failed to load terms list', 'error')
        }
      } catch (err) {
        console.error('Error loading terms:', err)
        showNotification('Error loading terms list', 'error')
      } finally {
        setLoadingTerms(false)
      }
    }

    fetchTeachers()
    fetchTerms()
  }, [user.school, showNotification, selectedYearId]) // refetch when the selected school year changes

  // ───── Section navigation ─────
  const grade = classData?.grade
  const sections: SectionNavItem[] = useMemo(() => {
    const assessmentsLabel =
      grade != null && isJK(grade)
        ? 'Skill Domains'
        : grade != null && isSK(grade)
          ? 'Subjects & Standards'
          : 'Assessments'
    return [
      { id: 'details', label: 'Class Details', icon: AcademicCapIcon },
      { id: 'teachers', label: 'Teachers', icon: UsersIcon },
      { id: 'students', label: 'Students', icon: UserGroupIcon },
      { id: 'assessments', label: assessmentsLabel, icon: ClipboardDocumentListIcon },
    ]
  }, [grade])

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])
  const { activeId, scrollTo } = useScrollSpy({ sectionIds })

  // Deep link: /classes/[id]/edit#assessments etc.
  useEffect(() => {
    if (loading || !classData) return
    const hash = window.location.hash.replace('#', '')
    if (hash && sectionIds.includes(hash)) {
      // rAF so the grade-dependent section has painted before measuring
      requestAnimationFrame(() => scrollTo(hash, { behavior: 'auto', updateHash: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, classData])

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex justify-center items-center py-32">
            <Spinner size="lg" />
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Class</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/classes')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium cursor-pointer"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Classes
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!classData) return null

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <ClassEditHeader
            classData={classData}
            onDuplicate={() => setShowDuplicateModal(true)}
          />

          {/* Mobile: sticky chip bar */}
          <SectionNav
            sections={sections}
            activeId={activeId}
            onNavigate={scrollTo}
            variant="mobile"
          />

          <div className="flex items-start gap-8 mt-4 lg:mt-0">
            {/* Desktop: sticky section rail */}
            <SectionNav
              sections={sections}
              activeId={activeId}
              onNavigate={scrollTo}
              variant="desktop"
            />

            <div className="flex-1 min-w-0 space-y-6">
              <section id="details">
                <ClassDetailsCard
                  classData={classData}
                  teachers={teachers}
                  terms={terms}
                  loadingTeachers={loadingTeachers}
                  loadingTerms={loadingTerms}
                  currentTermData={currentTermData}
                  onSaved={setClassData}
                />
              </section>

              <section id="teachers">
                <TeachersCard
                  classData={classData}
                  teachers={teachers}
                  loadingTeachers={loadingTeachers}
                  onClassRefetch={fetchClass}
                />
              </section>

              <section id="students">
                <StudentsCard classId={classId} classGrade={classData.grade} />
              </section>

              <section id="assessments">
                {isJK(classData.grade) ? (
                  <JKDomainsSection school={classData.school} grade={classData.grade} />
                ) : isSK(classData.grade) ? (
                  <SKSubjectsSection school={classData.school} grade={classData.grade} />
                ) : (
                  <AssessmentsSection classId={classId} />
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* ─ Duplicate Class Modal ─ */}
      {showDuplicateModal && classData && (
        <ClassDuplicateModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          sourceClass={classData}
          onDuplicated={() => router.push('/classes')}
        />
      )}
    </>
  )
}
