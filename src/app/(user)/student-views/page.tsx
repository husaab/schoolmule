'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { listStudentViews, deleteStudentView } from '@/services/studentViewService'
import type { StudentViewPayload } from '@/services/types/studentView'
import { TrophyIcon, PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon, ShieldCheckIcon, LockClosedIcon, UsersIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

type Tab = 'mine' | 'shared' | 'system'

export default function StudentViewsListPage() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [views, setViews] = useState<StudentViewPayload[]>([])
  const [tab, setTab] = useState<Tab>('mine')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listStudentViews()
      setViews(res.data || [])
    } catch (e) {
      showNotification('Failed to load views', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (v: StudentViewPayload) => {
    if (!confirm(`Delete "${v.name}"?`)) return
    try {
      await deleteStudentView(v.viewId)
      showNotification('View deleted', 'success')
      load()
    } catch (e) {
      showNotification('Delete failed', 'error')
    }
  }

  const filtered = views.filter((v) => {
    if (tab === 'system') return v.isSystem
    if (tab === 'shared') return v.isShared && !v.isSystem && v.ownerUserId !== user?.id
    return v.ownerUserId === user?.id && !v.isSystem
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 rounded-xl">
                <TrophyIcon className="w-7 h-7 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Student Views</h1>
                <p className="text-sm text-slate-500">Saved filters for awards and academic recognition</p>
              </div>
            </div>
            <Link
              href="/student-views/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New View
            </Link>
          </div>

          <div className="flex gap-1 mb-6 border-b border-slate-200">
            {(['mine', 'shared', 'system'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'mine' ? 'My Views' : t === 'shared' ? 'Shared' : 'System'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-slate-500 text-sm bg-white rounded-xl border border-slate-200 p-8 text-center">
              No views in this tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((v) => (
                <ViewCard
                  key={v.viewId}
                  view={v}
                  currentUserId={user?.id || ''}
                  currentUserRole={user?.role || ''}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function ViewCard({
  view,
  currentUserId,
  currentUserRole,
  onDelete,
}: {
  view: StudentViewPayload
  currentUserId: string
  currentUserRole: string
  onDelete: (v: StudentViewPayload) => void
}) {
  const isOwner = view.ownerUserId === currentUserId && !view.isSystem
  // Admins can edit system views (but not delete them).
  const canEdit = isOwner || (view.isSystem && currentUserRole === 'ADMIN')
  const canDelete = isOwner
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 truncate">{view.name}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{view.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {view.isSystem && <Badge icon={ShieldCheckIcon} label="System" tone="amber" />}
          {!view.isSystem && view.isShared && <Badge icon={UsersIcon} label="Shared" tone="cyan" />}
          {!view.isSystem && !view.isShared && <Badge icon={LockClosedIcon} label="Private" tone="slate" />}
        </div>
      </div>
      <div className="text-xs text-slate-500 mb-4">
        <CriteriaChip criteria={view.criteria} />
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/student-views/${view.viewId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          <EyeIcon className="w-4 h-4" /> Open
        </Link>
        {canEdit && (
          <Link
            href={`/student-views/${view.viewId}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <PencilSquareIcon className="w-4 h-4" /> Edit
          </Link>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(view)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-rose-600 hover:bg-rose-50"
          >
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
        )}
      </div>
    </div>
  )
}

function CriteriaChip({ criteria }: { criteria: StudentViewPayload['criteria'] }) {
  const modeLabel: Record<string, string> = {
    overall_avg: 'overall avg',
    every_class: 'every class',
    any_class: 'any class',
  }
  const scopeLabel: Record<string, string> = {
    active: 'active term',
    specific: 'one term',
    all: 'all terms',
    every_listed: 'every listed term',
    any_listed: 'any listed term',
  }
  return (
    <span>
      ≥{criteria.thresholdPercent}% · {modeLabel[criteria.aggregationMode]} · {scopeLabel[criteria.termScope]}
    </span>
  )
}

function Badge({ icon: Icon, label, tone }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; tone: 'amber' | 'cyan' | 'slate' }) {
  const styles = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  } as const
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${styles[tone]}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}
