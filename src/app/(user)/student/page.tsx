'use client'

// The student's home (Student-Home and Student-Phone boards): a greeting, a
// nudge to pick an avatar until they have, what is due soon and missing, the
// latest published grades, and a card for each of their classes. Below md the
// due and missing work is laid out as the phone board has it (PhoneHome), and
// the avatar beside the greeting opens the picker (the sidebar's Change
// avatar is desktop-only).

import { useState } from 'react'
import Avatar from '@/components/avatar/Avatar'
import AvatarPickerModal from '@/components/avatar/AvatarPickerModal'
import PickAvatarCard from '@/components/avatar/PickAvatarCard'
import ClassCardsGrid from '@/components/classroom/ClassCardsGrid'
import LoadError from '@/components/classroom/LoadError'
import NewGradesCard from '@/components/classroom/NewGradesCard'
import DueSoonCard from '@/components/studentPortal/DueSoonCard'
import PhoneHome from '@/components/studentPortal/PhoneHome'
import StudentShell from '@/components/studentPortal/StudentShell'
import { shareClassesFromHome } from '@/components/studentPortal/useStudentClasses'
import { shareStudentAvatarFromHome, useStudentMe } from '@/components/studentPortal/useStudentMe'
import { useLoad } from '@/hooks/useLoad'
import { firstNameOf, greetingFor, homeDueLine } from '@/lib/classroomText'
import { studentClassHref, studentGradesHref } from '@/lib/portalRoutes'
import { longDateLine } from '@/lib/studentAccounts'
import { saveAvatar } from '@/services/profileService'
import { getStudentHome } from '@/services/studentPortalService'
import type { AvatarSpec } from '@/services/types/profile'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

export default function StudentHomePage() {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const username = useUserStore((s) => s.user.username)
  const storeAvatar = useUserStore((s) => s.user.avatar)
  const photoUrl = useUserStore((s) => s.user.photoUrl ?? null)
  const notify = useNotificationStore((s) => s.showNotification)
  const { me } = useStudentMe()
  const [pickerOpen, setPickerOpen] = useState(false)

  const home = useLoad(userId && role === 'STUDENT' ? `home:${userId}` : null, async () => {
    const res = await getStudentHome()
    if (userId) {
      shareClassesFromHome(userId, res.data.classes)
      shareStudentAvatarFromHome(userId, res.data.student.avatar)
    }
    return res.data
  })

  const data = home.data
  const now = new Date()
  const first = firstNameOf(data?.student.firstName || me?.student.firstName || username) || 'there'
  // The login's own pick; the neutral avatar until they choose one.
  const ownAvatar = storeAvatar ?? me?.user.avatar ?? null
  const showPick = !!me && !ownAvatar
  const name = data?.student.name ?? me?.student.name ?? username ?? 'You'

  const save = async (next: AvatarSpec) => {
    const res = await saveAvatar(next)
    const store = useUserStore.getState()
    store.setUser({ ...store.user, avatar: res.data.avatar })
    notify('Avatar saved', 'success')
  }

  const teacherOf = (classId: string) => data?.classes.find((c) => c.classId === classId)?.teacher ?? null

  return (
    <StudentShell title="Home">
      {home.error && !data ? (
        <LoadError title="We couldn't open your page" message={home.error.message} onRetry={home.reload} />
      ) : !data ? (
        <div className="flex flex-col gap-6" aria-label="Loading">
          <div className="animate-pulse space-y-3">
            <div className="h-9 w-64 rounded-lg bg-slate-100" />
            <div className="h-4 w-48 rounded bg-slate-100" />
          </div>
          <div className="h-48 animate-pulse rounded-[18px] bg-slate-100" />
          <div className="h-40 animate-pulse rounded-[18px] bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-[30px] font-semibold leading-tight text-slate-900 md:text-[34px]">
                <span className="md:hidden">Hi, {first}</span>
                <span className="hidden md:inline">
                  {greetingFor(now)}, {first}
                </span>
              </h2>
              <p className="order-first text-sm text-slate-500 md:order-none md:text-base md:text-slate-600">
                {[longDateLine(now), homeDueLine(data.dueSoon, now)].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={!me}
              aria-label="Change your avatar"
              className="shrink-0 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-default md:hidden"
            >
              <Avatar student name={name} avatar={ownAvatar ?? data.student.avatar} photoUrl={photoUrl} size={44} />
            </button>
          </div>

          {showPick && <PickAvatarCard onPick={() => setPickerOpen(true)} />}

          <PhoneHome missing={data.missing} dueSoon={data.dueSoon} newGrades={data.newGrades} now={now} />

          {(data.missing.length > 0 || data.dueSoon.length > 0 || data.newGrades.length > 0) && (
            <div className="hidden flex-wrap items-stretch gap-5 md:flex">
              <DueSoonCard missing={data.missing} dueSoon={data.dueSoon} now={now} />
              <NewGradesCard
                grades={data.newGrades}
                teacherOf={teacherOf}
                hrefFor={(g) => studentGradesHref({ classId: g.classId })}
              />
            </div>
          )}

          <section className="flex flex-col gap-3.5">
            <h3 className="font-display text-xl font-semibold text-slate-900">My classes</h3>
            {data.classes.length > 0 ? (
              <ClassCardsGrid classes={data.classes} hrefFor={(id) => studentClassHref(id)} now={now} />
            ) : (
              <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-4 text-base text-slate-700">
                Your classes will show up here soon.
              </p>
            )}
          </section>
        </div>
      )}

      <AvatarPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Your avatar"
        subtitle="Your teachers see it next to your name."
        name={name}
        student
        value={ownAvatar}
        onSave={save}
      />
    </StudentShell>
  )
}
