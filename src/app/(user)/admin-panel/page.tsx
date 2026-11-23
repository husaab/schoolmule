'use client'

// The admin panel: what needs someone now, then every admin tool the user
// can open, in the sidebar's groups, each with one live line from the
// overview (GET /admin/overview, lib/adminOverview). Search narrows the tools,
// pins put the favourites first, and signups can be reviewed (or QuickBooks
// synced) without leaving the page. Every tool is filtered by the route rules
// (lib/adminTools), so a row never leads to a page that bounces.

import React, { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import EmptyState from '@/components/ui/EmptyState'
import AttentionCard from '@/components/adminPanel/AttentionCard'
import ReviewQueue, { type ReviewQueueKind } from '@/components/adminPanel/ReviewQueue'
import ToolRow, { CountPill, ToolChip } from '@/components/adminPanel/ToolRow'
import ToolSearch from '@/components/adminPanel/ToolSearch'
import { useAccess } from '@/hooks/useAccess'
import { useAdminOverview } from '@/hooks/useAdminOverview'
import { useAdminPins } from '@/hooks/useAdminPins'
import { adminToolsFor, groupOf, searchTools, type AdminTool } from '@/lib/adminTools'
import { attentionCountFor, attentionItems, attentionState, overviewHealth, plural, toolStatus, type AttentionItem } from '@/lib/adminOverview'
import { pinnedTools } from '@/lib/adminPins'
import { getSchoolName } from '@/lib/schoolUtils'
import { syncNow } from '@/services/financeService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

const cardClass = 'rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'

const AdminPanelPage = () => {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const { canOpen } = useAccess()
  const notify = useNotificationStore((s) => s.showNotification)

  const groups = useMemo(() => adminToolsFor(user), [user])
  const overview = useAdminOverview()
  // While another school year loads, keep the last year's answer on screen.
  const data = overview.data ?? overview.previous
  const now = useMemo(() => new Date(), [data]) // eslint-disable-line react-hooks/exhaustive-deps
  const items = useMemo(() => attentionItems(data, canOpen, now), [data, canOpen, now])
  const firstLoad = overview.loading && !data
  const cardState = attentionState({ overview: data, items, loading: firstLoad, requestFailed: !data && Boolean(overview.error) })

  const pins = useAdminPins(user.id, user.school)
  const pinned = pinnedTools(pins.pins, groups)

  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0
  const results = useMemo(() => searchTools(groups, query), [groups, query])

  const [reviewing, setReviewing] = useState<ReviewQueueKind | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const closeReview = useCallback(() => setReviewing(null), [])

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const toolLinks = () => Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>('a[data-tool-link]') ?? [])

  const runAction = async (item: AttentionItem) => {
    if (!item.action) return
    if (item.action.kind === 'review') {
      setReviewing(item.action.queue)
      return
    }
    setBusyId(item.id)
    try {
      const res = await syncNow()
      notify(res.data.alreadyQueued ? 'A sync is already queued' : 'Sync queued', 'success')
      overview.reload()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Couldn’t queue a sync', 'error')
    } finally {
      setBusyId(null)
    }
  }

  // ↑/↓ walk the visible rows; ↑ from the first goes back to the search.
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const links = toolLinks()
    const i = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (i === -1) return
    e.preventDefault()
    if (e.key === 'ArrowDown') links[Math.min(i + 1, links.length - 1)].focus()
    else if (e.key === 'ArrowUp') (i === 0 ? inputRef.current : links[i - 1])?.focus()
    else if (e.key === 'Home') links[0].focus()
    else links[links.length - 1].focus()
  }

  const row = (tool: AdminTool, groupLabel?: string) => {
    const group = groupOf(groups, tool)
    return (
      <ToolRow
        key={tool.href}
        tool={tool}
        tone={group?.tone ?? 'slate'}
        status={toolStatus(tool.href, data, now)}
        loading={firstLoad}
        count={attentionCountFor(items, tool.href)}
        pinned={pins.isPinned(tool.href)}
        onTogglePin={(t) => pins.toggle(t.href)}
        groupLabel={groupLabel}
      />
    )
  }

  const school = user.school ? getSchoolName(user.school) : null
  const yearLabel = data?.schoolYear?.label

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">Admin Panel</h1>
              <p className="text-sm text-slate-500 mt-1">
                {[school, yearLabel && `${yearLabel} school year`].filter(Boolean).join(', ') || 'Your school’s settings, people and planning'}
              </p>
            </div>
            <ToolSearch
              value={query}
              onChange={setQuery}
              inputRef={inputRef}
              onSubmit={() => results[0] && router.push(results[0].href)}
              onArrowDown={() => toolLinks()[0]?.focus()}
            />
          </div>

          {pinned.length > 0 && !searching && (
            <nav aria-label="Pinned tools" className="mb-6 flex flex-wrap gap-2">
              {pinned.map((tool) => {
                const count = attentionCountFor(items, tool.href)
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 text-sm font-medium text-slate-800 transition-colors hover:border-cyan-300 hover:bg-cyan-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <ToolChip tool={tool} tone={groupOf(groups, tool)?.tone ?? 'slate'} size="sm" />
                    {tool.label}
                    {count > 0 && <CountPill count={count} />}
                  </Link>
                )
              })}
            </nav>
          )}

          {!searching && (
            <AttentionCard
              state={cardState}
              items={items}
              partial={overviewHealth(data).failed > 0}
              busyId={busyId}
              onAction={runAction}
              onRetry={overview.reload}
            />
          )}

          <p className="sr-only" aria-live="polite">
            {searching ? (results.length ? plural(results.length, 'tool') : 'No tools match') : ''}
          </p>

          <div id="admin-tools" ref={listRef} onKeyDown={onListKeyDown}>
            {searching ? (
              <section className={`${cardClass} p-2`} aria-label="Search results">
                {results.length > 0 ? (
                  <ul>{results.map((tool) => row(tool, groupOf(groups, tool)?.label))}</ul>
                ) : (
                  <EmptyState
                    icon={MagnifyingGlassIcon}
                    title={`No tool matches “${query.trim()}”`}
                    description="Try another word, like approvals, terms or timetable."
                    action={
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          inputRef.current?.focus()
                        }}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-cyan-300"
                      >
                        Clear search
                      </button>
                    }
                  />
                )}
              </section>
            ) : (
              <div className="columns-1 xl:columns-2 gap-4">
                {groups.map((group) => (
                  <section key={group.key} aria-labelledby={`group-${group.key}`} className={`${cardClass} mb-4 break-inside-avoid p-2`}>
                    <h2 id={`group-${group.key}`} className="px-3 pb-1 pt-2 font-display text-[15px] font-semibold text-slate-900">
                      {group.label}
                    </h2>
                    <ul>{group.tools.map((tool) => row(tool))}</ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {reviewing && <ReviewQueue queue={reviewing} onClose={closeReview} onChanged={overview.reload} />}
    </>
  )
}

export default AdminPanelPage
