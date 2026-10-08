'use client'

// Admin oversight of announcements: every post in the school with reach,
// email delivery state, and edit / delete for any of them.

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, MapPinIcon, MegaphoneIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import StatTile from '@/components/ui/StatTile'
import EmptyState from '@/components/ui/EmptyState'
import { getAnnouncement, listAnnouncements, retryAnnouncementEmails } from '@/services/announcementService'
import type { AnnouncementDetail, AnnouncementItem, AnnouncementScope } from '@/services/types/announcement'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { formatListStamp } from '@/components/messaging/formatters'
import AnnouncementComposerModal from './AnnouncementComposerModal'
import DeleteAnnouncementModal from './DeleteAnnouncementModal'

const SCOPE_LABEL: Record<AnnouncementScope, string> = { class: 'Class', grade: 'Grade', school: 'Whole school' }

interface Props {
  /** Bumped by the page after a "New announcement" save so the table refetches. */
  refreshKey?: number
}

const AdminAnnouncementsTable: React.FC<Props> = ({ refreshKey = 0 }) => {
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((s) => s.showNotification)
  // Loading is derived: the result carries the key it was fetched for.
  const [result, setResult] = useState<{ key: string; items: AnnouncementItem[] } | null>(null)
  const [reload, setReload] = useState(0)
  const [author, setAuthor] = useState('')
  const [scope, setScope] = useState<'' | AnnouncementScope>('')
  const [grade, setGrade] = useState('')
  const [failedOnly, setFailedOnly] = useState(false)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<AnnouncementDetail | null>(null)
  const [deleting, setDeleting] = useState<AnnouncementItem | null>(null)

  const fetchKey = `${selectedYearId ?? ''}|${refreshKey}|${reload}`
  useEffect(() => {
    let cancelled = false
    listAnnouncements({ limit: 200 })
      .then((res) => {
        if (!cancelled) setResult({ key: fetchKey, items: res.data ?? [] })
      })
      .catch(() => !cancelled && setResult({ key: fetchKey, items: [] }))
    return () => {
      cancelled = true
    }
  }, [fetchKey])
  const loading = result?.key !== fetchKey
  const items = useMemo(() => (result?.key === fetchKey ? result.items : []), [result, fetchKey])

  const authors = useMemo(() => [...new Set(items.map((i) => i.authorName))].sort(), [items])
  const grades = useMemo(() => [...new Set(items.map((i) => i.grade ?? i.classGrade).filter(Boolean) as string[])].sort((a, b) => a.length - b.length || a.localeCompare(b)), [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items
      .filter((i) => (author ? i.authorName === author : true))
      .filter((i) => (scope ? i.scope === scope : true))
      .filter((i) => (grade ? (i.grade ?? i.classGrade) === grade : true))
      .filter((i) => (failedOnly ? i.emailFailed : true))
      .filter((i) => (needle ? `${i.title} ${i.body} ${i.scopeLabel}`.toLowerCase().includes(needle) : true))
  }, [items, author, scope, grade, failedOnly, q])

  const seenPct = (i: AnnouncementItem) => ((i.audienceCount ?? 0) > 0 ? Math.round(((i.seenCount ?? 0) / (i.audienceCount ?? 1)) * 100) : 0)
  const avgSeen = items.length ? Math.round(items.reduce((n, i) => n + seenPct(i), 0) / items.length) : 0
  const failedCount = items.filter((i) => i.emailFailed).length
  const pinnedCount = items.filter((i) => i.isPinned).length

  const startEdit = async (item: AnnouncementItem) => {
    try {
      const res = await getAnnouncement(item.announcementId)
      if (res.data) setEditing(res.data)
    } catch {
      showNotification('Could not load announcement', 'error')
    }
  }
  const retry = async (item: AnnouncementItem) => {
    try {
      const res = await retryAnnouncementEmails(item.announcementId)
      showNotification(`${res.data?.requeued ?? 0} emails queued again`, 'success')
      setReload((n) => n + 1)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not retry', 'error')
    }
  }

  const select = 'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 cursor-pointer'

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Announcements this year" value={items.length} loading={loading} />
        <StatTile label="Average seen" value={`${avgSeen}%`} tone={items.length === 0 ? 'muted' : avgSeen >= 70 ? 'good' : avgSeen >= 40 ? 'warn' : 'bad'} loading={loading} />
        <StatTile label="Pinned now" value={pinnedCount} loading={loading} />
        <StatTile label="Email delivery failures" value={failedCount} tone={failedCount > 0 ? 'bad' : 'neutral'} loading={loading} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="block">
          <span className="sr-only">Author</span>
          <select value={author} onChange={(e) => setAuthor(e.target.value)} className={select}>
            <option value="">All authors</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Scope</span>
          <select value={scope} onChange={(e) => setScope(e.target.value as '' | AnnouncementScope)} className={select}>
            <option value="">All scopes</option>
            {(Object.keys(SCOPE_LABEL) as AnnouncementScope[]).map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Grade</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={select}>
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setFailedOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors cursor-pointer ${failedOnly ? 'border-rose-200 bg-rose-50 text-rose-700 font-medium' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Email failed
        </button>
        <label className="relative ml-auto block w-full sm:w-72">
          <span className="sr-only">Search</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or message…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MegaphoneIcon} title="No announcements match" description="Try another filter, or post the first one with New announcement." />
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Announcement</th>
                <th className="px-4 py-2.5 font-medium">Author</th>
                <th className="px-4 py-2.5 font-medium">Posted</th>
                <th className="px-4 py-2.5 font-medium">Seen</th>
                <th className="px-4 py-2.5 font-medium">Emails</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.announcementId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1.5 font-medium text-slate-900">
                      {i.isPinned && <MapPinIcon className="h-3.5 w-3.5 text-amber-600" aria-label="Pinned" />}
                      {i.title}
                    </p>
                    <p className="text-xs text-slate-400">{i.scopeLabel}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {i.authorName}
                    {i.authorRole === 'ADMIN' && <span className="ml-1 text-[11px] text-slate-400">(admin)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatListStamp(i.publishedAt)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      {i.seenCount ?? 0} / {i.audienceCount ?? 0}
                      <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                        <span className="block h-full bg-cyan-600" style={{ width: `${seenPct(i)}%` }} />
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {i.emailFailed ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-px text-[10px] font-medium text-rose-700">Email failed</span>
                        <button type="button" onClick={() => void retry(i)} className="text-xs font-medium text-rose-700 underline cursor-pointer">
                          retry
                        </button>
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-px text-[10px] font-medium text-emerald-700">Sent / queued</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/messages?tab=announcements&announcement=${encodeURIComponent(i.announcementId)}`} className="text-xs font-medium text-cyan-700 hover:text-cyan-900">
                      Open
                    </Link>
                    <button type="button" onClick={() => void startEdit(i)} className="ml-3 text-xs font-medium text-cyan-700 hover:text-cyan-900 cursor-pointer">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(i)} className="ml-3 text-xs font-medium text-rose-700 hover:text-rose-900 cursor-pointer">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnnouncementComposerModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        tone="staff"
        mode="edit"
        existing={editing}
        onSaved={() => {
          setEditing(null)
          setReload((n) => n + 1)
        }}
      />
      <DeleteAnnouncementModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        item={deleting}
        onDeleted={(id) => {
          setDeleting(null)
          setResult((r) => (r ? { ...r, items: r.items.filter((x) => x.announcementId !== id) } : r))
        }}
      />
    </>
  )
}

export default AdminAnnouncementsTable
