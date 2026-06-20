'use client'

import React, { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { listStudentViews, deleteStudentView } from '@/services/studentViewService'
import type { StudentViewPayload } from '@/services/types/studentView'
import {
  TrophyIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  UsersIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import { useFilterParams } from '@/hooks/useFilterParams'

type Tab = 'dashboard' | 'mine' | 'shared' | 'system'

function StudentViewsDashboardContent() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()
  const [views, setViews] = useState<StudentViewPayload[]>([])
  const [loading, setLoading] = useState(true)
  // Search seeded from URL; tab is URL source of truth.
  const [query, setQuery] = useState(() => get('q'))
  const tab = (get('tab', 'dashboard')) as Tab

  const load = async () => {
    setLoading(true)
    try {
      const res = await listStudentViews()
      setViews(res.data || [])
    } catch {
      showNotification('Failed to load views', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (v: StudentViewPayload) => {
    const baseMsg = `Delete "${v.name}"?`
    // System views are school-wide baselines — extra friction before letting
    // an admin pull the rug out from under everyone in the school.
    const message = v.isSystem
      ? `${baseMsg}\n\nThis is a SYSTEM view used school-wide. All teachers will lose access immediately. This cannot be undone.`
      : baseMsg
    if (!confirm(message)) return
    if (v.isSystem) {
      const confirmText = window.prompt(
        `To confirm deletion of the system view "${v.name}", type DELETE in capital letters:`,
      )
      if (confirmText !== 'DELETE') {
        showNotification('Deletion cancelled', 'error')
        return
      }
    }
    try {
      await deleteStudentView(v.viewId)
      showNotification('View deleted', 'success')
      load()
    } catch {
      showNotification('Delete failed', 'error')
    }
  }

  const { systemViews, myViews, sharedViews, counts } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (v: StudentViewPayload) =>
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)

    const system: StudentViewPayload[] = []
    const mine: StudentViewPayload[] = []
    const shared: StudentViewPayload[] = []
    // Counts are computed on the *unfiltered* set so tab badges stay stable.
    const c = { system: 0, mine: 0, shared: 0 }
    for (const v of views) {
      const isMine = v.ownerUserId === user?.id && !v.isSystem
      const isShared = !v.isSystem && !isMine && v.isShared
      if (v.isSystem) c.system += 1
      else if (isMine) c.mine += 1
      else if (isShared) c.shared += 1

      if (!matches(v)) continue
      if (v.isSystem) system.push(v)
      else if (isMine) mine.push(v)
      else if (isShared) shared.push(v)
    }
    return { systemViews: system, myViews: mine, sharedViews: shared, counts: c }
  }, [views, query, user?.id])

  const totalVisible = systemViews.length + myViews.length + sharedViews.length

  // Active tab content
  const flatTabViews =
    tab === 'mine' ? myViews : tab === 'shared' ? sharedViews : tab === 'system' ? systemViews : []
  const flatTabLabel =
    tab === 'mine'
      ? 'Views you\'ve created'
      : tab === 'shared'
      ? 'Shared with you'
      : tab === 'system'
      ? 'School-wide views'
      : ''

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        <main className="px-6 pt-28 pb-12 max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Hero */}
          <header className="flex items-start justify-between gap-6 mb-10">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 shrink-0">
                <TrophyIcon className="w-8 h-8 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Views</h1>
                <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
                  Saved filters that surface students by academic performance — for honor rolls, awards,
                  and recognition. Open a view to see who currently qualifies.
                </p>
              </div>
            </div>
            <Link
              href="/student-views/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shrink-0"
            >
              <PlusIcon className="w-4 h-4" />
              New view
            </Link>
          </header>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 mb-6 border-b border-slate-200">
            <TabButton active={tab === 'dashboard'} onClick={() => setParams({ tab: null })}>
              Dashboard
            </TabButton>
            <TabButton active={tab === 'mine'} onClick={() => setParams({ tab: 'mine' })} count={counts.mine}>
              Mine
            </TabButton>
            <TabButton active={tab === 'shared'} onClick={() => setParams({ tab: 'shared' })} count={counts.shared}>
              Shared
            </TabButton>
            <TabButton active={tab === 'system'} onClick={() => setParams({ tab: 'system' })} count={counts.system}>
              System
            </TabButton>
          </div>

          {/* Search — only meaningful when there are several views */}
          {views.length > 4 && (
            <div className="relative mb-10">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setParams({ q: e.target.value }); }}
                placeholder="Search views by name or description"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              />
            </div>
          )}

          {loading ? (
            <SectionSkeleton />
          ) : tab !== 'dashboard' ? (
            <FlatTab
              title={flatTabLabel}
              views={flatTabViews}
              query={query}
              currentUserId={user?.id || ''}
              currentUserRole={user?.role || ''}
              onDelete={handleDelete}
              variant={tab === 'system' ? 'featured' : 'default'}
            />
          ) : totalVisible === 0 && query ? (
            <EmptyResults query={query} />
          ) : (
            <div className="space-y-12">
              {/* Featured: System views — always rendered, even if filter hides others */}
              <Section
                eyebrow="Featured"
                title="School-wide views"
                description="Permanent, school-wide filters for academic recognition. Always available."
                count={systemViews.length}
                accent="amber"
              >
                {systemViews.length === 0 ? (
                  <SectionEmpty>No matching school-wide views.</SectionEmpty>
                ) : (
                  <CardGrid>
                    {systemViews.map((v) => (
                      <ViewCard
                        key={v.viewId}
                        view={v}
                        currentUserId={user?.id || ''}
                        currentUserRole={user?.role || ''}
                        onDelete={handleDelete}
                        variant="featured"
                      />
                    ))}
                  </CardGrid>
                )}
              </Section>

              {/* Yours */}
              <Section
                eyebrow="Yours"
                title="Views you've created"
                description="Private to you unless you toggle sharing."
                count={myViews.length}
                accent="cyan"
              >
                {myViews.length === 0 ? (
                  <SectionEmpty>
                    <p className="mb-3">You haven&apos;t created any views yet.</p>
                    <Link
                      href="/student-views/new"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      Create your first view
                    </Link>
                  </SectionEmpty>
                ) : (
                  <CardGrid>
                    {myViews.map((v) => (
                      <ViewCard
                        key={v.viewId}
                        view={v}
                        currentUserId={user?.id || ''}
                        currentUserRole={user?.role || ''}
                        onDelete={handleDelete}
                      />
                    ))}
                  </CardGrid>
                )}
              </Section>

              {/* Shared — only render section if non-empty */}
              {sharedViews.length > 0 && (
                <Section
                  eyebrow="From colleagues"
                  title="Shared with you"
                  description="Views other teachers in your school have shared."
                  count={sharedViews.length}
                  accent="slate"
                >
                  <CardGrid>
                    {sharedViews.map((v) => (
                      <ViewCard
                        key={v.viewId}
                        view={v}
                        currentUserId={user?.id || ''}
                        currentUserRole={user?.role || ''}
                        onDelete={handleDelete}
                      />
                    ))}
                  </CardGrid>
                </Section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function StudentViewsDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <StudentViewsDashboardContent />
    </Suspense>
  )
}

/* ───────────────────────────  Tabs  ─────────────────────────── */

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 -mb-px text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
        active
          ? 'border-cyan-600 text-cyan-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {typeof count === 'number' && (
          <span
            className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              active ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {count}
          </span>
        )}
      </span>
    </button>
  )
}

function FlatTab({
  title,
  views,
  query,
  currentUserId,
  currentUserRole,
  onDelete,
  variant,
}: {
  title: string
  views: StudentViewPayload[]
  query: string
  currentUserId: string
  currentUserRole: string
  onDelete: (v: StudentViewPayload) => void
  variant: 'default' | 'featured'
}) {
  if (views.length === 0) {
    if (query) return <EmptyResults query={query} />
    return (
      <SectionEmpty>
        {title === "Views you've created" ? (
          <>
            <p className="mb-3">You haven&apos;t created any views yet.</p>
            <Link
              href="/student-views/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              <SparklesIcon className="w-4 h-4" />
              Create your first view
            </Link>
          </>
        ) : (
          <p>No views in this category.</p>
        )}
      </SectionEmpty>
    )
  }
  return (
    <CardGrid>
      {views.map((v) => (
        <ViewCard
          key={v.viewId}
          view={v}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDelete={onDelete}
          variant={variant}
        />
      ))}
    </CardGrid>
  )
}

/* ───────────────────────────  Sections  ─────────────────────────── */

function Section({
  eyebrow,
  title,
  description,
  count,
  accent,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  count: number
  accent: 'amber' | 'cyan' | 'slate'
  children: React.ReactNode
}) {
  const eyebrowStyles = {
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    cyan: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
  }[accent]

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className={`inline-flex items-center text-[10px] uppercase tracking-[0.12em] font-semibold px-2 py-0.5 rounded-md border ${eyebrowStyles}`}
            >
              {eyebrow}
            </span>
            <span className="text-xs text-slate-400">
              {count} {count === 1 ? 'view' : 'views'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

function SectionEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

/* ───────────────────────────  Card  ─────────────────────────── */

function ViewCard({
  view,
  currentUserId,
  currentUserRole,
  onDelete,
  variant = 'default',
}: {
  view: StudentViewPayload
  currentUserId: string
  currentUserRole: string
  onDelete: (v: StudentViewPayload) => void
  variant?: 'default' | 'featured'
}) {
  const isOwner = view.ownerUserId === currentUserId && !view.isSystem
  const isAdmin = currentUserRole === 'ADMIN'
  const canEdit = isOwner || (view.isSystem && isAdmin)
  // Admins can now delete any view in their school, including system views.
  // Non-admins still only delete what they own.
  const canDelete = isOwner || isAdmin

  const cardStyles =
    variant === 'featured'
      ? 'bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-200/70 hover:border-amber-300'
      : 'bg-white border-slate-200 hover:border-slate-300'

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${cardStyles}`}
    >
      {/* Accent stripe on featured */}
      {variant === 'featured' && (
        <div className="absolute left-0 top-5 bottom-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{view.name}</h3>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2">{view.description}</p>
        </div>
        <div className="shrink-0">
          {view.isSystem ? (
            <Badge icon={ShieldCheckIcon} label="System" tone="amber" />
          ) : view.isShared ? (
            <Badge icon={UsersIcon} label="Shared" tone="cyan" />
          ) : (
            <Badge icon={LockClosedIcon} label="Private" tone="slate" />
          )}
        </div>
      </div>

      <CriteriaSummary criteria={view.criteria} />

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
        <Link
          href={`/student-views/${view.viewId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800 group-hover:gap-2 transition-all"
        >
          <EyeIcon className="w-4 h-4" />
          Open
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`/student-views/new?duplicateFrom=${encodeURIComponent(view.viewId)}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </Link>
          {canEdit && (
            <Link
              href={`/student-views/${view.viewId}/edit`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Edit"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </Link>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(view)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────  Sub-components  ─────────────────────────── */

function CriteriaSummary({ criteria }: { criteria: StudentViewPayload['criteria'] }) {
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
    <div className="flex flex-wrap gap-1.5 mt-2">
      <Chip>≥ {criteria.thresholdPercent}%</Chip>
      <Chip>{modeLabel[criteria.aggregationMode]}</Chip>
      <Chip>{scopeLabel[criteria.termScope]}</Chip>
      {criteria.gradeLevels && criteria.gradeLevels.length > 0 && (
        <Chip>grades {criteria.gradeLevels.join(', ')}</Chip>
      )}
      {criteria.subjects && criteria.subjects.length > 0 && (
        <Chip>
          {criteria.subjects.length} subject{criteria.subjects.length === 1 ? '' : 's'}
        </Chip>
      )}
      {criteria.attendanceMinPercent != null && (
        <Chip>attendance ≥ {criteria.attendanceMinPercent}%</Chip>
      )}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200">
      {children}
    </span>
  )
}

function Badge({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  tone: 'amber' | 'cyan' | 'slate'
}) {
  const styles = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  } as const
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${styles[tone]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

function SectionSkeleton() {
  return (
    <div className="space-y-12">
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="h-7 w-48 bg-slate-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-80 bg-slate-100 rounded mb-5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((c) => (
              <div key={c} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="h-5 w-2/3 bg-slate-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded mb-4 animate-pulse" />
                <div className="flex gap-1.5">
                  <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
      <MagnifyingGlassIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 font-medium">No views match &ldquo;{query}&rdquo;</p>
      <p className="text-sm text-slate-400 mt-1">Try a different search or create a new view.</p>
    </div>
  )
}
