'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import StatTile from '@/components/ui/StatTile'
import EmptyState from '@/components/ui/EmptyState'
import UserViewModal from '@/components/adminUsers/UserViewModal'
import UserFormModal from '@/components/adminUsers/UserFormModal'
import UserDeleteModal from '@/components/adminUsers/UserDeleteModal'
import {
  RoleBadge,
  STATUS_META,
  StatusBadge,
  UserAvatar,
  UserStatus,
  formatDate,
  statusOf,
} from '@/components/adminUsers/userDisplay'
import { getSchoolUsers } from '@/services/adminUserService'
import { SchoolRole, SchoolUser } from '@/services/types/adminUser'
import { useUserStore } from '@/store/useUserStore'
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

type RoleFilter = 'ALL' | SchoolRole
type StatusFilter = 'ALL' | UserStatus

const ROLE_TABS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ADMIN', label: 'Admins' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'PARENT', label: 'Parents' },
]

const UsersPage = () => {
  const currentUserId = useUserStore((s) => s.user.id)
  const [users, setUsers] = useState<SchoolUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [viewing, setViewing] = useState<SchoolUser | null>(null)
  const [editing, setEditing] = useState<SchoolUser | null>(null)
  const [deleting, setDeleting] = useState<SchoolUser | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await getSchoolUsers()
      setUsers(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(
    () => ({
      total: users.length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
      TEACHER: users.filter((u) => u.role === 'TEACHER').length,
      PARENT: users.filter((u) => u.role === 'PARENT').length,
      needsAttention: users.filter((u) => statusOf(u) !== 'active').length,
    }),
    [users]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        (roleFilter === 'ALL' || u.role === roleFilter) &&
        (statusFilter === 'ALL' || statusOf(u) === statusFilter) &&
        (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  }, [users, search, roleFilter, statusFilter])

  const upsert = (saved: SchoolUser) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.userId === saved.userId)
      const next = exists ? prev.map((u) => (u.userId === saved.userId ? saved : u)) : [...prev, saved]
      return next.sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      )
    })
    // Keep an open detail modal in sync with the edit.
    setViewing((v) => (v && v.userId === saved.userId ? saved : v))
  }

  const remove = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.userId !== userId))
    setViewing(null)
  }

  const hasFilters = search || roleFilter !== 'ALL' || statusFilter !== 'ALL'

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Users</h1>
              <p className="text-slate-500 mt-1">Everyone with a School Mule account at your school</p>
            </div>
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 cursor-pointer"
            >
              <UserPlusIcon className="h-5 w-5" />
              Add user
            </button>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatTile label="Total users" value={counts.total} />
            <StatTile label="Admins" value={counts.ADMIN} />
            <StatTile label="Teachers" value={counts.TEACHER} />
            <StatTile label="Parents" value={counts.PARENT} />
            <StatTile
              label="Pending or no access"
              value={counts.needsAttention}
              tone={counts.needsAttention > 0 ? 'warn' : 'neutral'}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Filter by role">
                {ROLE_TABS.map((tab) => {
                  const active = roleFilter === tab.value
                  const count = tab.value === 'ALL' ? counts.total : counts[tab.value]
                  return (
                    <button
                      key={tab.value}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setRoleFilter(tab.value)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-1.5 font-mono tabular-nums text-xs text-slate-400">{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  aria-label="Filter by status"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="ALL">Any status</option>
                  {(Object.keys(STATUS_META) as UserStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
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
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={UsersIcon}
                title="Couldn't load users"
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
                icon={UsersIcon}
                title={users.length === 0 ? 'No users yet' : 'No matching users'}
                description={
                  users.length === 0
                    ? 'Add your staff and parents, or share your school signup link.'
                    : 'Try a different search or filter.'
                }
                action={
                  hasFilters ? (
                    <button
                      onClick={() => {
                        setSearch('')
                        setRoleFilter('ALL')
                        setStatusFilter('ALL')
                      }}
                      className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer"
                    >
                      Clear filters
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((u) => {
                      const isSelf = u.userId === currentUserId
                      return (
                        <tr
                          key={u.userId}
                          onClick={() => setViewing(u)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setViewing(u)
                            }
                          }}
                          tabIndex={0}
                          aria-label={`View ${u.fullName}`}
                          className="group cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar user={u} />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-slate-900">
                                  {u.fullName}
                                  {isSelf && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}
                                </div>
                                <div className="truncate text-xs text-slate-500">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge user={u} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditing(u)}
                                title="Edit"
                                aria-label={`Edit ${u.fullName}`}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-cyan-50 hover:text-cyan-600 cursor-pointer"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setDeleting(u)}
                                  title="Delete"
                                  aria-label={`Delete ${u.fullName}`}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                >
                                  <TrashIcon className="h-4 w-4" />
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

      {viewing && (
        <UserViewModal
          isOpen={Boolean(viewing)}
          onClose={() => setViewing(null)}
          user={viewing}
          onEdit={() => setEditing(viewing)}
          onDelete={() => setDeleting(viewing)}
        />
      )}
      {(adding || editing) && (
        <UserFormModal
          isOpen
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
          user={editing}
          onSaved={upsert}
        />
      )}
      {deleting && (
        <UserDeleteModal
          isOpen={Boolean(deleting)}
          onClose={() => setDeleting(null)}
          user={deleting}
          onDeleted={remove}
        />
      )}
    </>
  )
}

export default UsersPage
