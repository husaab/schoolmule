// File: src/app/(user)/classes/[classId]/page.tsx
// One class (the Teacher-* class boards): the class header and banner, then
// Stream · Classwork · Grades · People · Settings. The open tab is ?tab= in
// the URL and is not remembered: a bare /classes/{id} (a card, a row, a
// Back link) always opens the Stream, so a link that needs another tab
// passes it through classHref. An archived class still opens, with a note
// and Unarchive for those who may edit it. Grades uses the whole page width
// under a slimmer header (UX review E1); the other tabs keep a reading width.
'use client'

import { Suspense, useState, type ComponentType } from 'react'
import { useParams } from 'next/navigation'
import { AcademicCapIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import BackLink from '@/components/shared/BackLink'
import ClassIdentityModal from '@/components/classes/identity/ClassIdentityModal'
import ClassHeader from '@/components/classes/page/ClassHeader'
import ClassTabs from '@/components/classes/page/ClassTabs'
import { useClassPage } from '@/components/classes/page/useClassPage'
import type { ClassTabProps } from '@/components/classes/page/tabs'
import StreamTab from '@/components/classes/stream/StreamTab'
import ClassworkTab from '@/components/classes/classwork/ClassworkTab'
import GradesTab from '@/components/classes/grades/GradesTab'
import PeopleTab from '@/components/classes/people/PeopleTab'
import SettingsTab from '@/components/classes/settings/SettingsTab'
import { useFilterParams, type FilterPatch } from '@/hooks/useFilterParams'
import { classHref, parseClassTab, type ClassTab } from '@/lib/classroomRoutes'
import { classTitle, gradeShort } from '@/lib/classesHome'
import { isFullWidthTab } from '@/lib/gradesLayout'
import { unarchiveClass } from '@/services/classroomService'
import { useNotificationStore } from '@/store/useNotificationStore'

const TAB_BODIES: Record<ClassTab, ComponentType<ClassTabProps>> = {
  stream: StreamTab,
  classwork: ClassworkTab,
  grades: GradesTab,
  people: PeopleTab,
  settings: SettingsTab,
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <Sidebar />
    <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">{children}</main>
  </>
)

function ClassPageContent() {
  const { classId } = useParams() as { classId: string }
  const filters = useFilterParams({ remember: false })
  const tab = parseClassTab(filters.get('tab'))
  const { data, error, loading, reload, patchClass } = useClassPage(classId)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [unarchiving, setUnarchiving] = useState(false)

  // A tab owns its own params (sub, q, topic…): switching tabs starts clean.
  const selectTab = (next: ClassTab) => {
    const patch: FilterPatch = {}
    for (const key of Array.from(filters.params.keys())) patch[key] = null
    patch.tab = next === 'stream' ? null : next
    filters.setParams(patch)
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center py-32">
          <Spinner size="lg" />
        </div>
      </Shell>
    )
  }

  if (!data) {
    const message =
      error?.status === 404
        ? "This class doesn't exist, or it was deleted."
        : error?.status === 403
          ? "You don't teach this class, so it can't be opened from your account."
          : error?.message || "This class couldn't be loaded."
    return (
      <Shell>
        <div className="mx-auto max-w-4xl p-6 lg:p-8">
          <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <AcademicCapIcon className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Class not available</h2>
            <p className="mb-6 text-slate-600">{message}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {error?.status !== 404 && error?.status !== 403 && (
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
                >
                  Try again
                </button>
              )}
              <BackLink
                to="/classes"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 font-medium text-white hover:from-cyan-600 hover:to-teal-600"
              >
                Back to Classes
              </BackLink>
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  const cls = data.class
  const label = classTitle(cls.grade, cls.subject)
  const canEdit = data.permissions.canEdit
  const Body = TAB_BODIES[tab]
  const fullWidth = isFullWidthTab(tab)

  const unarchive = async () => {
    setUnarchiving(true)
    try {
      const res = await unarchiveClass(classId)
      patchClass({ archivedAt: res.data.archivedAt })
      showNotification(`${label} is back on class cards`, 'success')
    } catch (err) {
      showNotification(
        err instanceof Error && err.message ? err.message : "The class couldn't be unarchived. Try again.",
        'error',
      )
    } finally {
      setUnarchiving(false)
    }
  }

  return (
    <Shell>
      <ClassHeader data={data} compact={fullWidth}>
        <ClassTabs active={tab} hrefFor={(t) => classHref(classId, t)} onSelect={selectTab} />
      </ClassHeader>

      <div className={`px-6 pb-12 lg:px-8 ${fullWidth ? 'pt-5' : 'max-w-[1180px] pt-7'}`}>
        {cls.archivedAt && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-[18px] py-3.5">
            <p className="flex items-center gap-2.5 text-sm text-amber-900">
              <ArchiveBoxIcon className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              This class is archived. It is hidden from class cards and from students&apos; and parents&apos; class
              lists.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => void unarchive()}
                disabled={unarchiving}
                className="cursor-pointer rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
              >
                {unarchiving ? 'Unarchiving…' : 'Unarchive class'}
              </button>
            )}
          </div>
        )}

        <Body
          key={classId}
          classId={classId}
          data={data}
          reload={reload}
          patchClass={patchClass}
          onChangeBanner={canEdit ? () => setIdentityOpen(true) : undefined}
        />
      </div>

      {canEdit && (
        <ClassIdentityModal
          classId={classId}
          subject={cls.subject}
          gradeLabel={gradeShort(cls.grade)}
          teacherName={data.teachers.find((t) => t.role === 'lead')?.name ?? cls.teacherName ?? ''}
          identity={cls.identity}
          isOpen={identityOpen}
          onClose={() => setIdentityOpen(false)}
          onSaved={(identity) => patchClass({ identity })}
        />
      )}
    </Shell>
  )
}

export default function ClassPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <ClassPageContent />
    </Suspense>
  )
}
