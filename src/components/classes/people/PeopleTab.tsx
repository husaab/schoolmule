// src/components/classes/people/PeopleTab.tsx
// The class's people (the Teacher-People board): the teachers, then the
// students with their SchoolMule account status, parents, missing work and
// last activity. Teachers act on their own students' accounts here (resend an
// invite, reset a password, print a QR card, pick an avatar for a child who
// does not sign in); inviting a whole class is the admin's. Students never see
// this list, only their teachers.
'use client'

import { useState, type FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon, PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import AvatarPickerModal from '@/components/avatar/AvatarPickerModal'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import InviteStudentsModal from '@/components/studentAccounts/InviteStudentsModal'
import PrintQrCardsModal from '@/components/studentAccounts/PrintQrCardsModal'
import TabEmptyState from '@/components/classes/page/TabEmptyState'
import type { ClassTabProps } from '@/components/classes/page/tabs'
import { useDebouncedParam, useFilterParams } from '@/hooks/useFilterParams'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import {
  avatarPickerSubtitle,
  chipCounts,
  filterPeople,
  inviteButtonText,
  inviteCandidates,
  parsePeopleFilter,
  qrPrintedMessage,
  type PeopleFilter,
  type StudentMenuAction,
} from '@/lib/classPeople'
import { classHref } from '@/lib/classroomRoutes'
import {
  printClassQrCards,
  resendStudentInvite,
  resetStudentPassword,
  setStudentAvatar,
} from '@/services/classroomService'
import { getStudentAccounts } from '@/services/studentAccountService'
import type { PeopleStudent } from '@/services/types/classroom'
import type { AvatarSpec } from '@/services/types/profile'
import type { ClassroomSettings, StudentAccountRow } from '@/services/types/studentAccount'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { effectiveStaffRole } from '@/lib/permissions'
import PeopleStudentsTable from './PeopleStudentsTable'
import PeopleTeachersCard from './PeopleTeachersCard'
import { useClassPeople } from './useClassPeople'

const CHIP_BASE = 'cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors'
const CHIP_ON = 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800'
const CHIP_OFF = 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'

interface InviteRun {
  rows: StudentAccountRow[]
  settings: ClassroomSettings
}

const PeopleTab: FC<ClassTabProps> = ({ classId, data: page }) => {
  const router = useRouter()
  const { open: openProfile } = useStudentProfile()
  const notify = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  // "Message guardians" acts as an admin (every conversation, no term gate) only with messages.all.
  const messageRole = useUserStore((s) => effectiveStaffRole(s.user, 'messages.all'))
  const { data, error, loading, reload, patchStudent } = useClassPeople(classId)
  // False for a teacher looking at a past school year's class: it reads, it does not change accounts.
  const canEdit = page.permissions.canEdit

  const filters = useFilterParams({ remember: false })
  const [search, setSearch] = useDebouncedParam(filters, 'q')
  const filter: PeopleFilter = parsePeopleFilter(filters.get('filter'))
  const q = filters.get('q')

  const [busyId, setBusyId] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteRun, setInviteRun] = useState<InviteRun | null>(null)
  const [messageFor, setMessageFor] = useState<PeopleStudent | null>(null)
  const [avatarFor, setAvatarFor] = useState<PeopleStudent | null>(null)
  // Printing a card voids the older one: the student whose print is waiting on a yes.
  const [printFor, setPrintFor] = useState<PeopleStudent | null>(null)

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-slate-600">{error ?? "The class roster couldn't be loaded."}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  }

  const counts = chipCounts(data.students)
  const visible = filterPeople(data.students, { filter, q })
  const candidates = inviteCandidates(data.students)
  const filtering = filter !== '' || q.trim() !== ''
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

  const withBusy = async (student: PeopleStudent, run: () => Promise<void>) => {
    setBusyId(student.studentId)
    try {
      await run()
    } finally {
      setBusyId(null)
    }
  }

  const startInvite = async () => {
    if (inviteLoading) return
    setInviteLoading(true)
    try {
      // The admin list carries each student's own address, which the invite checks.
      const res = await getStudentAccounts()
      const wanted = new Set(candidates.map((c) => c.studentId))
      const rows = res.data.students.filter((r) => wanted.has(r.studentId) && r.status === 'not_invited')
      if (rows.length === 0) {
        notify('Everyone in this class who can be invited already has been.', 'error')
        void reload()
        return
      }
      setInviteRun({ rows, settings: res.data.settings })
    } catch (err) {
      notify(errorText(err, "The invite list couldn't be loaded. Try again."), 'error')
    } finally {
      setInviteLoading(false)
    }
  }

  const act = (action: StudentMenuAction, student: PeopleStudent) => {
    switch (action) {
      case 'view':
        return openProfile(student.studentId)
      case 'message':
        return setMessageFor(student)
      case 'resend_invite':
        return void withBusy(student, async () => {
          try {
            await resendStudentInvite(classId, student.studentId)
            notify(`Invite sent again to ${student.name}`, 'success')
          } catch (err) {
            notify(errorText(err, "The invite couldn't be sent."), 'error')
          }
        })
      case 'reset_password':
        return void withBusy(student, async () => {
          try {
            await resetStudentPassword(classId, student.studentId)
            notify(`Password link sent to ${student.name}`, 'success')
          } catch (err) {
            notify(errorText(err, "The password link couldn't be sent."), 'error')
          }
        })
      case 'print_qr':
        // The roster does not say whether the student holds a card now, so it always asks first.
        return setPrintFor(student)
      case 'change_avatar':
        return setAvatarFor(student)
    }
  }

  const printQr = (student: PeopleStudent) =>
    withBusy(student, async () => {
      try {
        const { count } = await printClassQrCards(classId, [student.studentId], `qr-card-${student.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
        notify(qrPrintedMessage(count), count > 0 ? 'error' : 'success')
      } catch (err) {
        notify(errorText(err, "The QR card couldn't be printed."), 'error')
      }
    })

  const saveAvatar = async (avatar: AvatarSpec) => {
    if (!avatarFor) return
    const res = await setStudentAvatar(classId, avatarFor.studentId, avatar)
    patchStudent(avatarFor.studentId, { avatar: res.data.avatar })
  }

  return (
    <div className="flex flex-col gap-6">
      <PeopleTeachersCard classId={classId} teachers={data.teachers} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <h2 className="font-display text-[22px] font-semibold text-slate-900">
            Students <span className="font-medium text-slate-500">{counts.all}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Link
                href={classHref(classId, 'stream', { compose: '1' })}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Message parents
              </Link>
            )}
            {data.canInvite && candidates.length > 0 && (
              <button
                type="button"
                onClick={() => void startInvite()}
                disabled={inviteLoading}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 disabled:cursor-wait disabled:opacity-70"
              >
                <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                {inviteLoading ? 'Loading…' : inviteButtonText(candidates.length)}
              </button>
            )}
          </div>
        </div>

        {data.students.length === 0 ? (
          <TabEmptyState icon={UserGroupIcon}>
            No students are enrolled yet. Add them in Settings, under Students.
          </TabEmptyState>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-transparent focus-within:ring-2 focus-within:ring-cyan-500">
                <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students or parents"
                  aria-label="Search students or parents"
                  className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                aria-pressed={filter === ''}
                onClick={() => filters.setParams({ filter: null })}
                className={`${CHIP_BASE} ${filter === '' ? CHIP_ON : CHIP_OFF}`}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed={filter === 'not-signed-in'}
                onClick={() => filters.setParams({ filter: 'not-signed-in' })}
                className={`${CHIP_BASE} ${filter === 'not-signed-in' ? CHIP_ON : CHIP_OFF}`}
              >
                Not signed in yet · {counts.notSignedIn}
              </button>
              <button
                type="button"
                aria-pressed={filter === 'missing'}
                onClick={() => filters.setParams({ filter: 'missing' })}
                className={`${CHIP_BASE} ${filter === 'missing' ? CHIP_ON : CHIP_OFF}`}
              >
                Missing work · {counts.missing}
              </button>
            </div>

            <PeopleStudentsTable students={visible} busyId={busyId} onAction={act} canEdit={canEdit} />

            {filtering && (
              <p className="text-[13px] text-slate-500">
                Showing {visible.length} of {counts.all} ·{' '}
                <button
                  type="button"
                  onClick={() => filters.setParams({ filter: null, q: null })}
                  className="cursor-pointer font-medium text-cyan-700 hover:text-cyan-900"
                >
                  Clear filters
                </button>
              </p>
            )}
          </>
        )}
        <p className="text-[13px] text-slate-500">Students see a People page with their teachers only, never a list of classmates.</p>
      </section>

      {inviteRun && (
        <InviteStudentsModal
          isOpen
          onClose={() => setInviteRun(null)}
          rows={inviteRun.rows}
          settings={inviteRun.settings}
          onDone={() => void reload()}
        />
      )}

      <NewConversationModal
        isOpen={messageFor !== null}
        onClose={() => setMessageFor(null)}
        tone="staff"
        role={messageRole}
        classId={classId}
        preset={messageFor ? { studentId: messageFor.studentId, mode: 'general' } : undefined}
        onCreated={(thread) => {
          setMessageFor(null)
          void bump()
          router.push(`/messages?thread=${encodeURIComponent(thread.conversation.conversationId)}`)
        }}
      />

      {printFor && (
        <PrintQrCardsModal
          isOpen
          onClose={() => setPrintFor(null)}
          names={[printFor.name]}
          withCards={null}
          onConfirm={() => printQr(printFor)}
        />
      )}

      <AvatarPickerModal
        isOpen={avatarFor !== null}
        onClose={() => setAvatarFor(null)}
        title={avatarFor ? `Change avatar for ${avatarFor.name}` : 'Change avatar'}
        subtitle={avatarFor ? avatarPickerSubtitle(avatarFor) : undefined}
        name={avatarFor?.name}
        value={avatarFor?.avatar ?? null}
        onSave={saveAvatar}
      />
    </div>
  )
}

export default PeopleTab
