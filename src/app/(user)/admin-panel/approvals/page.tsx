'use client'

// Approvals: everyone who signed up for this school and is waiting to be let
// in, plus the signups that were declined. Approving fixes the role they
// picked, links a parent to their children and emails them, all in one step.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import StatTile from '@/components/ui/StatTile'
import EmptyState from '@/components/ui/EmptyState'
import ApprovalReviewModal from '@/components/adminApprovals/ApprovalReviewModal'
import ApprovalDeclineModal from '@/components/adminApprovals/ApprovalDeclineModal'
import ApprovalRestoreModal from '@/components/adminApprovals/ApprovalRestoreModal'
import ApprovalRenameModal from '@/components/adminApprovals/ApprovalRenameModal'
import { RoleBadge, UserAvatar, formatDate } from '@/components/adminUsers/userDisplay'
import { changeSignupRole, getApprovals } from '@/services/adminApprovalService'
import { ApprovalUser, SignupRole } from '@/services/types/adminApproval'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  ArchiveBoxXMarkIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

type Tab = 'pending' | 'declined'
type RoleFilter = 'ALL' | SignupRole

const ROLE_TABS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'PARENT', label: 'Parents' },
]

// Who the school already has on file for this email. Approving links them;
// the review window lets the admin untick any that aren't theirs.
const MatchedChildren = ({ students }: { students: ApprovalUser['matchedChildren'] }) => {
  if (students.length === 0) {
    return <span className="text-xs text-slate-400">None matched</span>
  }
  const shown = students.slice(0, 2).map((c) => c.name.split(' ')[0])
  const extra = students.length - shown.length
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <SparklesIcon className="h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden />
      <span>
        <span className="font-medium">{students.length}</span>
        <span className="text-slate-500">
          {' '}
          · {shown.join(', ')}
          {extra > 0 && ` +${extra}`}
        </span>
      </span>
    </span>
  )
}

const ApprovalsPage = () => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [users, setUsers] = useState<ApprovalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('pending')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [search, setSearch] = useState('')

  const [reviewing, setReviewing] = useState<ApprovalUser | null>(null)
  const [declining, setDeclining] = useState<ApprovalUser | null>(null)
  const [restoring, setRestoring] = useState<ApprovalUser | null>(null)
  const [renaming, setRenaming] = useState<ApprovalUser | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await getApprovals()
      setUsers(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(() => users.filter((u) => !u.isArchived), [users])
  const declined = useMemo(() => users.filter((u) => u.isArchived), [users])
  const pool = tab === 'pending' ? pending : declined

  const countRoles = (list: ApprovalUser[]) => ({
    total: list.length,
    TEACHER: list.filter((u) => u.role === 'TEACHER').length,
    PARENT: list.filter((u) => u.role === 'PARENT').length,
  })
  const pendingCounts = useMemo(() => countRoles(pending), [pending])
  const counts = useMemo(() => countRoles(pool), [pool])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pool.filter(
      (u) =>
        (roleFilter === 'ALL' || u.role === roleFilter) &&
        (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  }, [pool, roleFilter, search])

  // Single-user responses (role change, rename, decline) don't recompute the
  // children on file, so keep what the list already knows.
  const upsert = (saved: ApprovalUser) =>
    setUsers((prev) => {
      const existing = prev.find((u) => u.userId === saved.userId)
      const next = { ...saved, matchedChildren: saved.matchedChildren ?? existing?.matchedChildren ?? [] }
      return existing ? prev.map((u) => (u.userId === saved.userId ? next : u)) : [next, ...prev]
    })
  const remove = (userId: string) => setUsers((prev) => prev.filter((u) => u.userId !== userId))

  // Fix a wrong-role signup without approving yet (e.g. a parent who picked Teacher).
  const handleRoleChange = async (user: ApprovalUser, role: SignupRole) => {
    if (role === user.role) return
    setChangingRoleId(user.userId)
    try {
      const res = await changeSignupRole(user.userId, role)
      upsert(res.data.user)
      notify(`${user.fullName} is now a ${role.toLowerCase()} signup`, 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to change role', 'error')
    } finally {
      setChangingRoleId(null)
    }
  }

  const hasFilters = search || roleFilter !== 'ALL'

  const emptyKind = tab === 'pending' && pending.length === 0
    ? 'caughtUp'
    : tab === 'declined' && declined.length === 0
      ? 'nothingDeclined'
      : 'noMatch'
  const EMPTY = {
    caughtUp: {
      icon: CheckCircleIcon,
      iconClassName: 'text-emerald-400',
      title: 'All caught up',
      description: 'New signups appear here once they verify their email. You get an email too.',
    },
    nothingDeclined: {
      icon: InboxIcon,
      iconClassName: 'text-slate-300',
      title: 'Nothing declined',
      description: 'Signups you decline are kept here so you can restore them.',
    },
    noMatch: {
      icon: InboxIcon,
      iconClassName: 'text-slate-300',
      title: 'No matching signups',
      description: 'Try a different search or filter.',
    },
  }[emptyKind]

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">User Approvals</h1>
              <p className="text-slate-500 mt-1">
                People who signed up for your school and are waiting to be let in
              </p>
            </div>
            <Link
              href="/admin-panel/users"
              className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
            >
              Invite someone instead →
            </Link>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label="Waiting for approval"
              value={pending.length}
              tone={pending.length > 0 ? 'warn' : 'good'}
              loading={loading}
            />
            <StatTile label="Parents waiting" value={pendingCounts.PARENT} loading={loading} />
            <StatTile label="Teachers waiting" value={pendingCounts.TEACHER} loading={loading} />
            <StatTile label="Declined" value={declined.length} tone="muted" loading={loading} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Pending or declined">
                  <button
                    role="tab"
                    aria-selected={tab === 'pending'}
                    onClick={() => setTab('pending')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                      tab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pending
                    <span className="font-mono tabular-nums text-xs text-slate-400">{pending.length}</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === 'declined'}
                    onClick={() => setTab('declined')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                      tab === 'declined' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ArchiveBoxXMarkIcon className="h-4 w-4" />
                    Declined
                    <span className="font-mono tabular-nums text-xs text-slate-400">{declined.length}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Filter by role">
                  {ROLE_TABS.map((t) => {
                    const active = roleFilter === t.value
                    const count = t.value === 'ALL' ? counts.total : counts[t.value]
                    return (
                      <button
                        key={t.value}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setRoleFilter(t.value)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                          active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {t.label}
                        <span className="ml-1.5 font-mono tabular-nums text-xs text-slate-400">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="relative sm:w-64">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={ShieldCheckIcon}
                title="Couldn't load approvals"
                description={error}
                iconClassName="text-rose-300"
                action={
                  <button onClick={load} className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer">
                    Try again
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={EMPTY.icon}
                iconClassName={EMPTY.iconClassName}
                title={EMPTY.title}
                description={EMPTY.description}
                action={
                  hasFilters ? (
                    <button
                      onClick={() => {
                        setSearch('')
                        setRoleFilter('ALL')
                      }}
                      className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer"
                    >
                      Clear filters
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="max-h-[calc(100vh-24rem)] min-h-[16rem] overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#f1f5f9]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {tab === 'pending' ? 'Signed up as' : 'Role'}
                      </th>
                      {tab === 'pending' && (
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Children on file
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {tab === 'pending' ? 'Signed up' : 'Declined'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((u) => {
                      const isPending = tab === 'pending'
                      const open = () => (isPending ? setReviewing(u) : setRestoring(u))
                      return (
                        <tr
                          key={u.userId}
                          onClick={open}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              open()
                            }
                          }}
                          tabIndex={0}
                          aria-label={`${isPending ? 'Review' : 'Restore'} ${u.fullName}`}
                          className={`group cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${
                            u.isArchived ? 'opacity-75' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar user={u} />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-slate-900">{u.fullName}</div>
                                <div className="truncate text-xs text-slate-500">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {isPending ? (
                              <select
                                value={u.role}
                                disabled={changingRoleId === u.userId}
                                onChange={(e) => handleRoleChange(u, e.target.value as SignupRole)}
                                aria-label={`Role for ${u.fullName}`}
                                title="Change the role they signed up for"
                                className={`cursor-pointer rounded-lg border-0 py-0.5 pl-2 pr-7 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 ${
                                  u.role === 'PARENT'
                                    ? 'bg-cyan-50 text-cyan-700 ring-cyan-200/60'
                                    : 'bg-purple-50 text-purple-700 ring-purple-200/60'
                                }`}
                              >
                                <option value="TEACHER">Teacher</option>
                                <option value="PARENT">Parent</option>
                              </select>
                            ) : (
                              <RoleBadge role={u.role} />
                            )}
                          </td>
                          {isPending && (
                            <td className="px-4 py-3 text-sm">
                              <MatchedChildren students={u.matchedChildren} />
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {formatDate(isPending ? u.createdAt : u.declinedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => setReviewing(u)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                    Review &amp; approve
                                  </button>
                                  <button
                                    onClick={() => setRenaming(u)}
                                    title="Rename"
                                    aria-label={`Rename ${u.fullName}`}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                                  >
                                    <PencilSquareIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeclining(u)}
                                    title="Decline"
                                    aria-label={`Decline ${u.fullName}`}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                                  >
                                    <ArchiveBoxXMarkIcon className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setRestoring(u)}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
                                >
                                  <ArrowUturnLeftIcon className="h-4 w-4" />
                                  Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {reviewing && (
        <ApprovalReviewModal
          isOpen
          onClose={() => setReviewing(null)}
          user={reviewing}
          onApproved={(result) => remove(result.user.userId)}
        />
      )}
      {declining && (
        <ApprovalDeclineModal
          isOpen
          onClose={() => setDeclining(null)}
          user={declining}
          onDeclined={upsert}
        />
      )}
      {renaming && (
        <ApprovalRenameModal
          isOpen
          onClose={() => setRenaming(null)}
          user={renaming}
          onRenamed={upsert}
        />
      )}
      {restoring && (
        <ApprovalRestoreModal
          isOpen
          onClose={() => setRestoring(null)}
          user={restoring}
          onRestored={upsert}
        />
      )}
    </>
  )
}

export default ApprovalsPage
