'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, BuildingLibraryIcon, MegaphoneIcon } from '@heroicons/react/24/outline'
import { listAnnouncements } from '@/services/announcementService'
import type { AnnouncementItem } from '@/services/types/announcement'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { formatListStamp } from '@/components/messaging/formatters'
import { childColor, childInitial } from './childColors'

/**
 * Dashboard card: the latest announcements across every child, unread
 * first. One quiet line when there is nothing yet, not an empty box.
 */
const AnnouncementsCard: React.FC<{ limit?: number }> = ({ limit = 3 }) => {
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const [result, setResult] = useState<{ year: string | null; items: AnnouncementItem[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    listAnnouncements({ limit: 20 })
      .then((res) => {
        if (cancelled) return
        const items = (res.data ?? []).slice().sort((a, b) => Number(!b.read) - Number(!a.read))
        setResult({ year: selectedYearId, items: items.slice(0, limit) })
      })
      .catch(() => !cancelled && setResult({ year: selectedYearId, items: [] }))
    return () => {
      cancelled = true
    }
  }, [selectedYearId, limit])

  const items = result?.items ?? []
  const unread = items.filter((i) => !i.read).length

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-5 mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MegaphoneIcon className="w-5 h-5 text-amber-500" />
          Announcements
          {unread > 0 && <span className="rounded-full bg-amber-700 px-2 py-px text-[10px] font-semibold text-white">{unread} new</span>}
        </h3>
        <Link href="/parent/messages?tab=announcements" className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900">
          See all <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {result === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No announcements yet. Teachers and the office post class and school news here.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((a) => {
            const child = a.children?.[0] ?? null
            const color = child ? childColor(child.studentId) : null
            return (
              <li key={a.announcementId}>
                <Link
                  href={`/parent/messages?tab=announcements&announcement=${encodeURIComponent(a.announcementId)}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-stone-50/60 -mx-2 px-2 rounded-xl"
                >
                  {color && child ? (
                    <span
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                      title={child.name}
                    >
                      {childInitial(child.name)}
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center flex-shrink-0" title="Whole school">
                      <BuildingLibraryIcon className="w-4 h-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${!a.read ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                      {a.title}
                      <span className="text-slate-400 font-normal"> · {a.scopeLabel}</span>
                    </span>
                    <span className="block truncate text-xs text-slate-500">{a.body}</span>
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-slate-400">{formatListStamp(a.publishedAt)}</span>
                  {!a.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-600" />}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default AnnouncementsCard
