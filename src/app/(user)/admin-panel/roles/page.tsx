'use client'

// Roles & permissions (full admins only): the built-in Admin and Teacher,
// read-only, and the school's custom access roles, created, edited,
// duplicated and deleted here and assigned to staff on the Users page.
// AuthGuard keeps everyone else out (lib/permissions ROUTE_RULES); a 403 from
// the API (full-admin status lost mid-session) shows the Forbidden notice.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import StatTile from '@/components/ui/StatTile'
import EmptyState from '@/components/ui/EmptyState'
import Forbidden from '@/components/errors/Forbidden'
import RoleFormModal, { type RoleSeed } from '@/components/adminRoles/RoleFormModal'
import RoleDeleteModal from '@/components/adminRoles/RoleDeleteModal'
import RoleHoldersModal from '@/components/adminRoles/RoleHolders'
import { PermissionChips, RoleKindBadge } from '@/components/adminRoles/roleDisplay'
import { getAccessRoles, getPermissionCatalog } from '@/services/accessRoleService'
import { isApiError } from '@/services/apiClient'
import type { AccessRole, AccessRoleList, BuiltInRole, PermissionCatalog } from '@/services/types/accessRole'
import { useAccess } from '@/hooks/useAccess'
import { permissionCountLabel } from '@/lib/accessRoles'
import {
  DocumentDuplicateIcon,
  EyeIcon,
  KeyIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'

const iconButton = 'rounded-lg p-2 text-slate-400 transition-colors cursor-pointer'

const byName = (a: AccessRole, b: AccessRole) => a.name.localeCompare(b.name)

const RolesPage = () => {
  const { fullAdmin } = useAccess()
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null)
  const [list, setList] = useState<AccessRoleList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  // One modal at a time, each mounted fresh for what it opens.
  const [creating, setCreating] = useState<RoleSeed | null | false>(false)
  const [editing, setEditing] = useState<AccessRole | null>(null)
  const [viewingBuiltIn, setViewingBuiltIn] = useState<BuiltInRole | null>(null)
  const [deleting, setDeleting] = useState<AccessRole | null>(null)
  const [holdersOf, setHoldersOf] = useState<AccessRole | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [cat, roles] = await Promise.all([getPermissionCatalog(), getAccessRoles()])
      setCatalog(cat.data)
      setList({ ...roles.data, roles: [...roles.data.roles].sort(byName) })
    } catch (err) {
      if (isApiError(err) && err.status === 403) setForbidden(true)
      else setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [])

  // AuthGuard has already turned away anyone who isn't a full admin; the
  // requests wait for the session to say so too.
  useEffect(() => {
    if (fullAdmin) void load()
  }, [fullAdmin, load])

  const roles = useMemo(() => list?.roles ?? [], [list])
  // The catalog's built-ins carry the definitions; the list's carry the counts.
  const builtIns = useMemo(
    () =>
      (catalog?.builtIns ?? []).map((b) => ({
        ...b,
        userCount: list?.builtIns.find((x) => x.id === b.id)?.userCount ?? b.userCount,
      })),
    [catalog, list],
  )

  const upsert = (saved: AccessRole) =>
    setList((prev) =>
      prev
        ? {
            ...prev,
            roles: (prev.roles.some((r) => r.roleId === saved.roleId)
              ? prev.roles.map((r) => (r.roleId === saved.roleId ? saved : r))
              : [...prev.roles, saved]
            ).sort(byName),
          }
        : prev,
    )

  const remove = (roleId: string) =>
    setList((prev) => (prev ? { ...prev, roles: prev.roles.filter((r) => r.roleId !== roleId) } : prev))

  const takenNames = (except?: string) => roles.filter((r) => r.roleId !== except).map((r) => r.name)
  const staffOnCustom = roles.reduce((sum, r) => sum + r.userCount, 0)

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        {forbidden ? (
          <Forbidden
            title="Full admins only"
            message="Only full admins can manage roles. If you think this is a mistake, ask one of your school's administrators."
          />
        ) : (
          <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Roles &amp; permissions</h1>
                <p className="text-slate-500 mt-1">Decide what each member of staff can see and do</p>
              </div>
              <button
                onClick={() => setCreating(null)}
                disabled={!catalog}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 cursor-pointer"
              >
                <PlusIcon className="h-5 w-5" />
                New role
              </button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              <StatTile label="Custom roles" value={roles.length} loading={loading} />
              <StatTile label="Staff on a custom role" value={staffOnCustom} loading={loading} />
              <StatTile label="Permissions to choose from" value={catalog?.permissions.length ?? 0} loading={loading} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" />
                </div>
              ) : error || !catalog ? (
                <EmptyState
                  icon={KeyIcon}
                  title="Couldn't load roles"
                  description={error ?? undefined}
                  iconClassName="text-rose-300"
                  action={
                    <button onClick={load} className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer">
                      Try again
                    </button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white shadow-[0_1px_0_0_#f1f5f9]">
                      <tr>
                        <th className={th}>Role</th>
                        <th className={th}>Can</th>
                        <th className={th}>People</th>
                        <th className="px-4 py-3 text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {builtIns.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => setViewingBuiltIn(b)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setViewingBuiltIn(b)
                            }
                          }}
                          tabIndex={0}
                          aria-label={`View the built-in ${b.name} role`}
                          className="group cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{b.name}</span>
                              <RoleKindBadge builtIn />
                            </div>
                            <div className="mt-0.5 max-w-sm text-xs text-slate-500">{b.description}</div>
                          </td>
                          <td className="px-4 py-3">
                            {b.id === 'admin' ? (
                              <span className="text-xs text-slate-500">Everything</span>
                            ) : (
                              <PermissionChips keys={b.permissions} catalog={catalog.permissions} />
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono tabular-nums text-sm text-slate-600">
                            {b.userCount ?? '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setViewingBuiltIn(b)}
                                title="View"
                                aria-label={`View the built-in ${b.name} role`}
                                className={`${iconButton} hover:bg-cyan-50 hover:text-cyan-600`}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setCreating({
                                    name: `${b.name} (copy)`,
                                    description: '',
                                    permissions: b.permissions,
                                  })
                                }
                                title="Start a custom role from this one"
                                aria-label={`Start a custom role from ${b.name}`}
                                className={`${iconButton} hover:bg-violet-50 hover:text-violet-600`}
                              >
                                <DocumentDuplicateIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {roles.map((r) => (
                        <tr
                          key={r.roleId}
                          onClick={() => setEditing(r)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setEditing(r)
                            }
                          }}
                          tabIndex={0}
                          aria-label={`Edit ${r.name}`}
                          className="group cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{r.name}</span>
                              <RoleKindBadge builtIn={false} />
                            </div>
                            {r.description && <div className="mt-0.5 max-w-sm truncate text-xs text-slate-500">{r.description}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <PermissionChips keys={r.permissions} catalog={catalog.permissions} />
                            <div className="mt-1 text-[11px] text-slate-400">{permissionCountLabel(r.permissions.length)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {r.userCount > 0 ? (
                              <button
                                onClick={() => setHoldersOf(r)}
                                title="See who has this role"
                                className="font-mono tabular-nums text-sm font-medium text-cyan-600 hover:underline cursor-pointer"
                              >
                                {r.userCount}
                              </button>
                            ) : (
                              <span className="font-mono tabular-nums text-sm text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() =>
                                  setCreating({
                                    name: `${r.name} (copy)`,
                                    description: r.description ?? '',
                                    permissions: r.permissions,
                                  })
                                }
                                title="Duplicate"
                                aria-label={`Duplicate ${r.name}`}
                                className={`${iconButton} hover:bg-violet-50 hover:text-violet-600`}
                              >
                                <DocumentDuplicateIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditing(r)}
                                title="Edit"
                                aria-label={`Edit ${r.name}`}
                                className={`${iconButton} hover:bg-cyan-50 hover:text-cyan-600`}
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleting(r)}
                                title="Delete"
                                aria-label={`Delete ${r.name}`}
                                className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {roles.length === 0 && (
                    <EmptyState
                      icon={KeyIcon}
                      title="No custom roles yet"
                      description="Create one for staff who need part of the admin toolkit, like an office manager who handles attendance, students and forms but not finance."
                      className="border-t border-slate-50"
                      action={
                        <button
                          onClick={() => setCreating(null)}
                          className="text-sm font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer"
                        >
                          Create a role
                        </button>
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {catalog && creating !== false && (
        <RoleFormModal
          isOpen
          onClose={() => setCreating(false)}
          catalog={catalog}
          seed={creating}
          takenNames={takenNames()}
          onSaved={upsert}
        />
      )}
      {catalog && editing && (
        <RoleFormModal
          key={editing.roleId}
          isOpen
          onClose={() => setEditing(null)}
          catalog={catalog}
          role={editing}
          takenNames={takenNames(editing.roleId)}
          onSaved={upsert}
        />
      )}
      {catalog && viewingBuiltIn && (
        <RoleFormModal
          key={viewingBuiltIn.id}
          isOpen
          onClose={() => setViewingBuiltIn(null)}
          catalog={catalog}
          builtIn={viewingBuiltIn}
          takenNames={[]}
          onSaved={upsert}
        />
      )}
      {deleting && (
        <RoleDeleteModal
          key={deleting.roleId}
          isOpen
          onClose={() => setDeleting(null)}
          role={deleting}
          onDeleted={remove}
          onBlocked={load}
        />
      )}
      {holdersOf && <RoleHoldersModal isOpen onClose={() => setHoldersOf(null)} role={holdersOf} />}
    </>
  )
}

export default RolesPage
