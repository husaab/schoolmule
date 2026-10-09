'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { Button } from '@/components/shared/modalKit'
import { getSchoolUserDetails, resendSchoolUserInvite } from '@/services/adminUserService'
import { SchoolUser, SchoolUserDetails } from '@/services/types/adminUser'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { previewViewsFor, type PreviewView } from '@/lib/previewViews'
import {
  AcademicCapIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  EyeIcon,
  HomeIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { RoleBadge, StatusBadge, UserAvatar, canImpersonate, formatDate, statusOf } from './userDisplay'

interface UserViewModalProps {
  isOpen: boolean
  onClose: () => void
  user: SchoolUser
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onUnarchive: () => void
  /** "View as": open the read-only preview confirmation, in the given portal. */
  onImpersonate: (view: PreviewView) => void
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</h3>
)

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs text-slate-400">{label}</dt>
    <dd className="mt-0.5 truncate text-sm text-slate-700">{children}</dd>
  </div>
)

const Quiet = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-slate-400">{children}</p>
)

const UserViewModal: React.FC<UserViewModalProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onImpersonate,
}) => {
  const currentUserId = useUserStore((s) => s.user.id)
  const notify = useNotificationStore((s) => s.showNotification)
  const [details, setDetails] = useState<SchoolUserDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const isSelf = user.userId === currentUserId
  const status = statusOf(user)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setDetails(null)
    setError(null)
    setLoading(true)
    getSchoolUserDetails(user.userId)
      .then((res) => !cancelled && setDetails(res.data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load details'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // Refetch when the row is edited, so the modal reflects the saved values.
  }, [isOpen, user.userId, user.lastModifiedAt])

  const handleResend = async () => {
    setResending(true)
    try {
      await resendSchoolUserInvite(user.userId)
      notify(`Invite resent to ${user.email}`, 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to resend invite', 'error')
    } finally {
      setResending(false)
    }
  }

  const isParent = user.role === 'PARENT'
  const staff = details?.staffProfile

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-xl">
      {/* Identity */}
      <header className="border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-6 pt-6 pb-5">
        <div className="flex items-center gap-4 pr-8">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-slate-900">{user.fullName}</h2>
              {isSelf && <span className="text-xs font-medium text-slate-400">(you)</span>}
            </div>
            <a
              href={`mailto:${user.email}`}
              className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500 hover:text-cyan-700"
            >
              <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
              {user.email}
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <RoleBadge role={user.role} title={user.staffTitle} />
          <StatusBadge user={user} />
        </div>
      </header>

      <div className="space-y-6 px-6 py-5">
        {status === 'archived' && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Archived {formatDate(user.archivedAt)}. Hidden from staff lists and teacher pickers, and
            can&apos;t sign in. Their records are kept. Restore them to bring the account back.
          </div>
        )}
        {status === 'invited' && (
          <div className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-sky-900">
              They haven&apos;t set a password yet. Invite links last 7 days.
            </p>
            <Button variant="secondary" onClick={handleResend} loading={resending} className="flex-shrink-0">
              <PaperAirplaneIcon className="h-4 w-4" />
              Resend invite
            </Button>
          </div>
        )}
        {status === 'awaiting' && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
            This account can&apos;t use School Mule until you give it school access (Edit → School access).
          </div>
        )}

        {/* Account */}
        <section className="space-y-3">
          <SectionLabel>Account</SectionLabel>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Fact label="Username">{user.username}</Fact>
            <Fact label="Email verified">{user.isVerified ? 'Yes' : 'No'}</Fact>
            <Fact label="School access">{user.isVerifiedSchool ? 'Granted' : 'Not granted'}</Fact>
            <Fact label="Joined">{formatDate(user.createdAt)}</Fact>
            <Fact label="Last updated">{formatDate(user.lastModifiedAt)}</Fact>
          </dl>
        </section>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : details && isParent ? (
          <section className="space-y-2">
            <SectionLabel>Children</SectionLabel>
            {details.children.length === 0 ? (
              <Quiet>
                Not linked to any students.{' '}
                <Link href="/admin-panel/relations" className="text-cyan-600 hover:underline">
                  Manage parent relations
                </Link>
              </Quiet>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {details.children.map((child) => (
                  <li key={child.studentId} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                      <UserGroupIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{child.name}</span>
                      {child.relation && <span className="text-xs text-slate-400">· {child.relation}</span>}
                    </span>
                    <span className="flex-shrink-0 text-xs text-slate-500">{getGradeDisplayName(child.grade)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : details ? (
          <>
            <section className="space-y-2">
              <SectionLabel>Teaching this year</SectionLabel>
              {details.classes.length === 0 && details.homeroom.length === 0 ? (
                <Quiet>No classes or homeroom in the selected school year.</Quiet>
              ) : (
                <div className="space-y-3">
                  {details.homeroom.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {details.homeroom.map((h) => (
                        <span
                          key={h.grade}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700"
                        >
                          <HomeIcon className="h-4 w-4" />
                          Homeroom {getGradeDisplayName(h.grade)} · {h.studentCount} student
                          {h.studentCount === 1 ? '' : 's'}
                        </span>
                      ))}
                    </div>
                  )}
                  {details.classes.length > 0 && (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                      {details.classes.map((c) => (
                        <li key={c.classId}>
                          <Link
                            href={`/classes/${c.classId}`}
                            className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <span className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                              <BookOpenIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                              <span className="truncate">
                                {getGradeDisplayName(c.grade)} · {c.subject}
                              </span>
                            </span>
                            <span className="flex flex-shrink-0 items-center gap-2 text-xs text-slate-500">
                              {c.termName}
                              {!c.isLead && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">Co-teacher</span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <SectionLabel>Staff directory</SectionLabel>
              {staff ? (
                <div className="space-y-2 rounded-xl border border-slate-100 px-3.5 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <AcademicCapIcon className="h-4 w-4 text-slate-400" />
                    {staff.staffRole}
                    {staff.homeroomGrade && (
                      <span className="font-normal text-slate-500">· Homeroom {staff.homeroomGrade}</span>
                    )}
                  </p>
                  {staff.phone && (
                    <a
                      href={`tel:${staff.phone.replace(/[^\d+]/g, '')}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-cyan-700"
                    >
                      <PhoneIcon className="h-4 w-4 text-slate-400" />
                      {staff.phone}
                      {staff.phoneContactHours && (
                        <span className="text-xs text-slate-400">· {staff.phoneContactHours}</span>
                      )}
                    </a>
                  )}
                  {staff.preferredContact && (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-400" />
                      Prefers {staff.preferredContact.toLowerCase()}
                    </p>
                  )}
                </div>
              ) : (
                <Quiet>No staff directory entry uses this email.</Quiet>
              )}
            </section>

            {/* Staff linked to a student are also parents: they get the parent
                view on this account, so show who it covers. */}
            {details.children.length > 0 && (
              <section className="space-y-2">
                <SectionLabel>Also a parent of</SectionLabel>
                <ul className="divide-y divide-slate-100 rounded-xl border border-amber-100 bg-amber-50/40">
                  {details.children.map((child) => (
                    <li key={child.studentId} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                        <UserGroupIcon className="h-4 w-4 flex-shrink-0 text-amber-500" />
                        <span className="truncate">{child.name}</span>
                        {child.relation && <span className="text-xs text-slate-400">· {child.relation}</span>}
                      </span>
                      <span className="flex-shrink-0 text-xs text-slate-500">{getGradeDisplayName(child.grade)}</span>
                    </li>
                  ))}
                </ul>
                <Quiet>They can switch to the parent portal from their own account.</Quiet>
              </section>
            )}
          </>
        ) : null}
      </div>

      <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
        {isSelf ? (
          <span className="text-xs text-slate-400">Manage your own login in Settings.</span>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onDelete} className="text-rose-600 hover:bg-rose-50">
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
            {status !== 'archived' && (
              <Button variant="secondary" onClick={onArchive} className="text-amber-700 hover:bg-amber-50">
                <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                Archive
              </Button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canImpersonate(user, currentUserId) &&
            (() => {
              // A teacher who is also a parent can be previewed in either portal.
              const views = previewViewsFor(user.role, details ? details.children.length > 0 : null)
              return views.map((view) => (
                <Button
                  key={view}
                  variant="secondary"
                  onClick={() => onImpersonate(view)}
                  className={view === 'PARENT' && views.length > 1 ? 'text-amber-700 hover:bg-amber-50' : 'text-violet-700 hover:bg-violet-50'}
                  title={
                    view === 'PARENT' && views.length > 1
                      ? 'See the parent portal exactly as this user does (read-only)'
                      : 'See School Mule exactly as this user does (read-only)'
                  }
                >
                  <EyeIcon className="h-4 w-4" />
                  {views.length > 1 ? (view === 'PARENT' ? 'View as parent' : 'View as teacher') : 'View as'}
                </Button>
              ))
            })()}
          {status === 'archived' ? (
            <Button onClick={onUnarchive}>
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Restore
            </Button>
          ) : (
            <Button onClick={onEdit}>
              <PencilSquareIcon className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </footer>
    </Modal>
  )
}

export default UserViewModal
