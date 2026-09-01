'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { getRecentPublications, markPublicationsSeen } from '@/services/parentPortalService'
import { RecentPublicationItem } from '@/services/types/parentPortal'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { childColor, childInitial, gradeTextColor } from './childColors'

const formatRelativeDate = (iso: string) => {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return then.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

const FeedRow: React.FC<{ item: RecentPublicationItem; showChild: boolean }> = ({
  item,
  showChild,
}) => {
  const color = childColor(item.studentId)

  return (
    <li className="flex items-center gap-3 py-3">
      {showChild && (
        <span
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
          title={item.childName}
        >
          {childInitial(item.childName)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800 truncate">
          {showChild && (
            <span className="text-slate-500">{item.childName.split(' ')[0]} · </span>
          )}
          <span className="text-slate-500">{item.subject} — </span>
          <span className="font-medium">{item.assessmentName}</span>
        </p>
        <p className="text-xs text-slate-400">{formatRelativeDate(item.publishedAt)}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {item.isNew && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
            New
          </span>
        )}
        <span className={`text-sm font-semibold ${gradeTextColor(item.pct)}`}>{item.pct}%</span>
      </div>
    </li>
  )
}

/**
 * "Recently published" — the parent's what's-new surface.
 *
 * Self-fetching so the dashboard doesn't have to thread its state through,
 * and it marks everything seen once per load: the NEW badges are there to
 * catch the eye on arrival, not to be dismissed one at a time.
 */
const RecentPublicationsFeed: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
  const [items, setItems] = useState<RecentPublicationItem[]>([])
  const [newCount, setNewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  // Guards the seen POST against React 19's dev double-invoke. Keyed by the
  // fetch it belongs to rather than a plain boolean, so switching school year
  // (which refetches a different set of marks) can still clear those badges.
  const markedSeenFor = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchKey = `${selectedYearId ?? 'none'}:${limit}`
    setLoading(true)
    setError(null)

    getRecentPublications(limit)
      .then((res) => {
        if (cancelled) return
        setItems(res.data?.items ?? [])
        setNewCount(res.data?.newCount ?? 0)

        if (markedSeenFor.current !== fetchKey) {
          markedSeenFor.current = fetchKey
          // Cosmetic — a failure here just means the badges show again.
          markPublicationsSeen().catch(() => {})
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setError('Could not load recent marks.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [limit, selectedYearId])

  const showChild = new Set(items.map((i) => i.studentId)).size > 1

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-5 mb-8">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-900">Recently Published</h2>
        </div>
        {newCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            {newCount} new
          </span>
        )}
      </div>

      {loading ? (
        <ul className="divide-y divide-stone-100">
          {[0, 1, 2].map((i) => (
            <li key={i} className="py-3">
              <div className="h-4 bg-stone-100 rounded animate-pulse w-2/3" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="text-sm text-rose-600 py-3">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 py-3">
          No marks have been published yet. You&rsquo;ll see new grades here as teachers share them.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-stone-100">
            {items.map((item) => (
              <FeedRow
                key={`${item.studentId}-${item.assessmentId}`}
                item={item}
                showChild={showChild}
              />
            ))}
          </ul>
          <Link
            href="/parent/grades"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 group"
          >
            View all in Grades
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </>
      )}
    </div>
  )
}

export default RecentPublicationsFeed
