// src/components/classes/settings/SettingsTab.tsx
// The class page's Settings tab (the Teacher-Settings board): what used to be
// the class edit page (details, teachers, students, the JK/SK skill setup)
// plus the banner, color and icon, the class options and duplicate / archive
// / delete. The grading setup is not here: it lives in Grades, next to the
// scores. Section hashes (#students, …) still scroll to their card.
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import ClassDuplicateModal from '@/components/classes/duplicate/classDuplicateModal'
import ClassDeleteModal from '@/components/classes/delete/classDeleteModal'
import ArchiveClassModal from '@/components/classes/home/ArchiveClassModal'
import type { ClassTabProps } from '@/components/classes/page/tabs'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { useRememberedHref } from '@/hooks/useFilterParams'
import { classHref } from '@/lib/classroomRoutes'
import { classTitle } from '@/lib/classesHome'
import { isJK, isSK } from '@/lib/schoolUtils'
import { getClassById } from '@/services/classService'
import { unarchiveClass } from '@/services/classroomService'
import { getTeachersBySchool } from '@/services/teacherService'
import { getTermByNameAndSchool, getTermsBySchool } from '@/services/termService'
import type { ClassPayload } from '@/services/types/class'
import type { TeacherPayload } from '@/services/types/teacher'
import type { TermPayload } from '@/services/types/term'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import ClassDetailsCard from './ClassDetailsCard'
import ClassOptionsCard from './ClassOptionsCard'
import DangerZoneCard from './DangerZoneCard'
import IdentityCard from './IdentityCard'
import SectionNav, { type SectionNavItem } from './SectionNav'
import StudentsCard from './StudentsCard'
import TeachersCard from './TeachersCard'
import JKDomainsSection from './jk/JKDomainsSection'
import SKSubjectsSection from './sk/SKSubjectsSection'

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

export default function SettingsTab({ classId, data, reload, patchClass, onChangeBanner }: ClassTabProps) {
  const router = useRouter()
  const classesHref = useRememberedHref('/classes')
  const school = useUserStore((s) => s.user.school)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((s) => s.showNotification)

  const { permissions } = data
  const canEdit = permissions.canEdit
  const cls = data.class
  const label = classTitle(cls.grade, cls.subject)

  // ───── The class as the class editor cards read it (the classes API) ─────
  const [classState, setClassState] = useState<{ data: ClassPayload | null; error: string | null } | null>(null)
  const fetchClass = useCallback(async () => {
    try {
      const res = await getClassById(classId)
      if (res.status === 'success') setClassState({ data: res.data, error: null })
      else setClassState((prev) => ({ data: prev?.data ?? null, error: res.message || 'Failed to load class' }))
    } catch (err) {
      setClassState((prev) => ({ data: prev?.data ?? null, error: errorText(err, 'Error fetching class') }))
    }
  }, [classId])
  useEffect(() => {
    void fetchClass()
  }, [fetchClass])
  const classData = classState?.data ?? null

  // ───── Teacher and term pick lists (details + teachers cards) ─────
  const [teachers, setTeachers] = useState<TeacherPayload[] | null>(null)
  const [terms, setTerms] = useState<TermPayload[] | null>(null)
  useEffect(() => {
    if (!school) return
    let live = true
    const load = async () => {
      const [teacherRes, termRes] = await Promise.allSettled([getTeachersBySchool(school), getTermsBySchool(school)])
      if (!live) return
      const teacherOk = teacherRes.status === 'fulfilled' && teacherRes.value.status === 'success'
      const termOk = termRes.status === 'fulfilled' && termRes.value.status === 'success'
      setTeachers(teacherOk ? teacherRes.value.data : [])
      setTerms(termOk ? termRes.value.data : [])
      if (!teacherOk) showNotification('Failed to load teacher list', 'error')
      if (!termOk) showNotification('Failed to load terms list', 'error')
    }
    void load()
    return () => {
      live = false
    }
  }, [school, selectedYearId, showNotification]) // refetch when the selected school year changes

  // The class's term, for its dates on the details card.
  const [currentTerm, setCurrentTerm] = useState<{ key: string; term: TermPayload } | null>(null)
  const termKey = classData?.termName && classData.school ? `${classData.school}|${classData.termName}` : null
  useEffect(() => {
    if (!termKey || !classData) return
    let live = true
    const load = async () => {
      try {
        const res = await getTermByNameAndSchool(classData.termName, classData.school)
        if (live && res.status === 'success') setCurrentTerm({ key: termKey, term: res.data })
      } catch (err) {
        console.error('Error fetching current term data:', err)
      }
    }
    void load()
    return () => {
      live = false
    }
    // classData is read through termKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termKey])
  const currentTermData = currentTerm && currentTerm.key === termKey ? currentTerm.term : null

  // ───── Sections ─────
  const jk = isJK(cls.grade)
  const sk = isSK(cls.grade)
  const sections: SectionNavItem[] = useMemo(
    () => [
      { id: 'details', label: 'Details', icon: AcademicCapIcon },
      { id: 'banner', label: 'Banner, color & icon', icon: PhotoIcon },
      { id: 'teachers', label: 'Teachers', icon: UsersIcon },
      { id: 'students', label: 'Students', icon: UserGroupIcon },
      ...(jk
        ? [{ id: 'skills', label: 'Skill domains', icon: ClipboardDocumentListIcon }]
        : sk
          ? [{ id: 'skills', label: 'Subjects & standards', icon: ClipboardDocumentListIcon }]
          : []),
      { id: 'classroom', label: 'Class options', icon: AdjustmentsHorizontalIcon },
      { id: 'danger', label: 'Duplicate, archive, delete', icon: ArchiveBoxIcon },
    ],
    [jk, sk],
  )
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])
  const { activeId, scrollTo } = useScrollSpy({ sectionIds })

  // Deep link (#students, and old edit-page hashes): scroll once the cards have painted.
  const scrolledForHash = useRef(false)
  useEffect(() => {
    if (!classData || scrolledForHash.current) return
    scrolledForHash.current = true
    const hash = window.location.hash.replace('#', '')
    if (hash && sectionIds.includes(hash)) {
      requestAnimationFrame(() => scrollTo(hash, { behavior: 'auto', updateHash: false }))
    }
  }, [classData, sectionIds, scrollTo])

  // ───── Duplicate, archive, delete ─────
  const [modal, setModal] = useState<'duplicate' | 'archive' | 'delete' | null>(null)
  const [unarchiving, setUnarchiving] = useState(false)

  const unarchive = async () => {
    setUnarchiving(true)
    try {
      const res = await unarchiveClass(classId)
      patchClass?.({ archivedAt: res.data.archivedAt })
      showNotification(`${label} is back on class cards`, 'success')
    } catch (err) {
      showNotification(errorText(err, "The class couldn't be unarchived. Try again."), 'error')
    } finally {
      setUnarchiving(false)
    }
  }

  const refreshClass = async () => {
    await fetchClass()
    await reload()
  }

  if (!classData) {
    return classState?.error ? (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <p className="text-rose-600">{classState.error}</p>
        <button
          type="button"
          onClick={() => void fetchClass()}
          className="mt-4 cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    ) : (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      {/* Mobile: sticky chip bar */}
      <SectionNav sections={sections} activeId={activeId} onNavigate={scrollTo} variant="mobile" />

      <div className="mt-4 flex items-start gap-8 lg:mt-0">
        {/* Desktop: sticky section rail */}
        <SectionNav sections={sections} activeId={activeId} onNavigate={scrollTo} variant="desktop" />

        <div className="min-w-0 flex-1 space-y-6">
          {!canEdit && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-[18px] py-3.5 text-sm text-amber-900">
              This class is from a past school year, so its settings are read-only. Only an admin can change them.
            </p>
          )}

          <section id="details">
            <ClassDetailsCard
              classData={classData}
              teachers={teachers ?? []}
              terms={terms ?? []}
              loadingTeachers={teachers === null}
              loadingTerms={terms === null}
              currentTermData={currentTermData}
              readOnly={!canEdit}
              onSaved={(updated) => {
                setClassState({ data: updated, error: null })
                void reload()
              }}
            />
          </section>

          <section id="banner">
            <IdentityCard
              classId={classId}
              identity={cls.identity}
              canEdit={canEdit}
              onOpenEditor={() => onChangeBanner?.()}
              onChanged={(identity) => patchClass?.({ identity })}
            />
          </section>

          <section id="teachers">
            <TeachersCard
              classData={classData}
              teachers={teachers ?? []}
              loadingTeachers={teachers === null}
              readOnly={!canEdit}
              onClassRefetch={refreshClass}
            />
          </section>

          <section id="students">
            <StudentsCard classId={classId} classGrade={classData.grade} readOnly={!canEdit} />
          </section>

          {(jk || sk) && (
            <section id="skills">
              {jk ? (
                <JKDomainsSection school={classData.school} grade={classData.grade} readOnly={!canEdit} />
              ) : (
                <SKSubjectsSection school={classData.school} grade={classData.grade} readOnly={!canEdit} />
              )}
            </section>
          )}

          {!jk && !sk && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-[18px] py-3.5 text-sm text-slate-600">
              Grading categories and the 100-point setup are in{' '}
              <Link
                href={classHref(classId, 'grades', { sub: 'setup' })}
                className="font-medium text-cyan-700 hover:text-cyan-800"
              >
                Grades → Assessments &amp; categories
              </Link>
              , next to the scores.
            </p>
          )}

          <section id="classroom">
            <ClassOptionsCard
              classId={classId}
              options={cls.options}
              parentsReadPrivateComments={data.settings.parentsReadPrivateComments}
              canEdit={canEdit}
              onChanged={(options) => patchClass?.({ options })}
            />
          </section>

          <section id="danger">
            <DangerZoneCard
              canEdit={canEdit}
              canDelete={permissions.canDelete}
              archived={!!cls.archivedAt}
              unarchiving={unarchiving}
              onDuplicate={() => setModal('duplicate')}
              onArchive={() => setModal('archive')}
              onUnarchive={() => void unarchive()}
              onDelete={() => setModal('delete')}
            />
          </section>
        </div>
      </div>

      {modal === 'duplicate' && (
        <ClassDuplicateModal
          isOpen
          onClose={() => setModal(null)}
          sourceClass={classData}
          onDuplicated={() => router.push(classesHref)}
        />
      )}
      <ArchiveClassModal
        isOpen={modal === 'archive'}
        onClose={() => setModal(null)}
        classId={classId}
        label={label}
        onArchived={(archivedAt) => {
          patchClass?.({ archivedAt })
          showNotification(`${label} is archived`, 'success')
        }}
      />
      {modal === 'delete' && permissions.canDelete && (
        <ClassDeleteModal
          isOpen
          onClose={() => setModal(null)}
          classData={classData}
          onDeleted={() => router.push(classesHref)}
        />
      )}
    </>
  )
}
