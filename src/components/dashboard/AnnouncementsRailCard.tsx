'use client'

// Staff dashboard right-rail card: the latest announcements the caller's
// classes received, with the reach line and a New button.

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { MegaphoneIcon, PlusIcon } from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import AnnouncementComposerModal from '@/components/announcements/AnnouncementComposerModal'
import AnnouncementScopeChip from '@/components/announcements/AnnouncementScopeChip'
import { listAnnouncements } from '@/services/announcementService'
import type { AnnouncementItem } from '@/services/types/announcement'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { formatListStamp } from '@/components/messaging/formatters'

const AnnouncementsRailCard: React.FC = () => {
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const [result, setResult] = useState<{ key: string; items: AnnouncementItem[] } | null>(null)
  const [reload, setReload] = useState(0)
  const [composing, setComposing] = useState(false)

  const key = `${selectedYearId ?? ''}|${reload}`
  useEffect(() => {
    let cancelled = false
    listAnnouncements({ limit: 3 })
      .then((res) => !cancelled && setResult({ key, items: res.data ?? [] }))
      .catch(() => !cancelled && setResult({ key, items: [] }))
    return () => {
      cancelled = true
    }
  }, [key])

  const items = result?.key === key ? result.items : null

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MegaphoneIcon className="w-5 h-5 text-cyan-600" /> Announcements
        </h3>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:from-cyan-600 hover:to-teal-600 cursor-pointer"
        >
          <PlusIcon className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {items === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing posted yet. One announcement reaches every family in a class at once.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={a.announcementId}>
              <Link href={`/messages?tab=announcements&announcement=${encodeURIComponent(a.announcementId)}`} className="block py-2.5 hover:bg-slate-50/60 -mx-2 px-2 rounded-xl">
                <span className="flex items-center gap-2 mb-0.5">
                  <AnnouncementScopeChip item={a} tone="staff" />
                  <span className="ml-auto flex items-center gap-1.5">
                    {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" aria-label="Unread" />}
                    <span className="text-[11px] text-slate-400">{formatListStamp(a.publishedAt)}</span>
                  </span>
                </span>
                <span className={`block truncate text-sm ${!a.read ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{a.title}</span>
                <span className="block text-xs text-cyan-700">
                  Seen by {a.seenCount ?? 0} of {a.audienceCount ?? 0} guardians
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AnnouncementComposerModal
        isOpen={composing}
        onClose={() => setComposing(false)}
        tone="staff"
        mode="create"
        onSaved={() => {
          setComposing(false)
          setReload((n) => n + 1)
        }}
      />
    </Card>
  )
}

export default AnnouncementsRailCard
