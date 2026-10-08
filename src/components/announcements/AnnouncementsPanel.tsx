'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MegaphoneIcon, PlusIcon } from '@heroicons/react/24/outline'
import { listAnnouncements } from '@/services/announcementService'
import type { AnnouncementDetail as Detail, AnnouncementItem } from '@/services/types/announcement'
import { formatListStamp } from '@/components/messaging/formatters'
import { toneClasses, type Tone } from '@/components/messaging/tones'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import AnnouncementComposerModal from './AnnouncementComposerModal'
import AnnouncementDetail from './AnnouncementDetail'
import AnnouncementScopeChip from './AnnouncementScopeChip'
import DeleteAnnouncementModal from './DeleteAnnouncementModal'

interface Props {
  tone: Tone
  classes: { classId: string; subject: string; grade: string | null }[]
  presetClassId?: string
}

const REFRESH_MS = 30_000

/**
 * Staff view: the list on the left (class filter, mine/all), the open
 * announcement on the right with read receipts and edit/delete. The open id
 * lives in ?announcement= so emails deep-link straight to it.
 */
const AnnouncementsPanel: React.FC<Props> = ({ tone, classes, presetClassId }) => {
  const t = toneClasses(tone)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const openId = searchParams.get('announcement')
  const [items, setItems] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [classId, setClassId] = useState(presetClassId ?? '')
  const [mine, setMine] = useState(false)
  const [composer, setComposer] = useState<{ mode: 'create' | 'edit'; existing?: Detail } | null>(null)
  const [deleting, setDeleting] = useState<AnnouncementItem | null>(null)
  const [version, setVersion] = useState(0)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const res = await listAnnouncements({ classId: classId || undefined, mine, limit: 100 })
        setItems(res.data ?? [])
      } catch {
        if (!silent) setItems([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [classId, mine],
  )

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      if (!document.hidden) void load(true)
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load, selectedYearId])

  const setOpen = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) params.set('announcement', id)
      else params.delete('announcement')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const onSaved = (detail: Detail) => {
    setComposer(null)
    setVersion((v) => v + 1)
    void load(true)
    setOpen(detail.announcementId)
  }
  const onDeleted = (id: string) => {
    setDeleting(null)
    setItems((cur) => cur.filter((i) => i.announcementId !== id))
    if (openId === id) setOpen(null)
  }

  const showList = !openId
  const empty = items.length === 0 && !loading

  return (
    <>
      <div className={`flex h-[calc(100vh-16rem)] min-h-[520px] overflow-hidden ${t.card}`}>
        {/* List pane */}
        <div className={`${showList ? 'flex' : 'hidden'} w-full flex-col lg:flex lg:w-[380px] lg:flex-shrink-0 lg:border-r ${t.divider}`}>
          <div className={`flex items-center justify-between border-b px-3 py-2.5 ${t.divider}`}>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Announcements</span>
            <button
              type="button"
              onClick={() => setComposer({ mode: 'create' })}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${t.primary} cursor-pointer`}
            >
              <PlusIcon className="h-3.5 w-3.5" /> New announcement
            </button>
          </div>
          <div className={`flex flex-wrap gap-2 border-b p-3 ${t.divider}`}>
            {classes.length > 0 && (
              <label className="min-w-0 flex-1 basis-40">
                <span className="sr-only">Class</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 cursor-pointer"
                >
                  <option value="">All my classes</option>
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.subject}
                      {c.grade ? ` · Gr ${c.grade}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="button" onClick={() => setMine(true)} className={`rounded-full border px-2.5 py-1 text-xs cursor-pointer ${mine ? t.chipActive : t.chipIdle}`}>
              Posted by me
            </button>
            <button type="button" onClick={() => setMine(false)} className={`rounded-full border px-2.5 py-1 text-xs cursor-pointer ${!mine ? t.chipActive : t.chipIdle}`}>
              All
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : empty ? (
              <div className="px-6 py-12 text-center">
                <MegaphoneIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">No announcements yet</p>
                <p className="mt-1 text-xs text-slate-500">Post one and every guardian in the class hears it at once.</p>
              </div>
            ) : (
              items.map((item) => {
                const selected = item.announcementId === openId
                const unread = !item.read
                return (
                  <button
                    key={item.announcementId}
                    type="button"
                    onClick={() => setOpen(item.announcementId)}
                    className={`relative block w-full border-b px-4 py-3 text-left transition-colors ${t.divider} ${selected ? t.rowSelected : 'hover:bg-slate-50/70'} cursor-pointer`}
                  >
                    {selected && <span className={`absolute inset-y-0 left-0 w-0.5 ${t.rowSelectedBar}`} aria-hidden />}
                    <span className="mb-1 flex items-center gap-2">
                      <AnnouncementScopeChip item={item} tone={tone} />
                      <span className="ml-auto flex items-center gap-1.5">
                        {unread && <span className={`h-2 w-2 rounded-full ${t.badge}`} aria-label="Unread" />}
                        <span className="text-[11px] text-slate-400">{formatListStamp(item.publishedAt)}</span>
                      </span>
                    </span>
                    <span className={`block truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{item.title}</span>
                    <span className="block truncate text-xs text-slate-500">{item.body}</span>
                    <span className={`mt-1 block text-[11px] ${t.accentText}`}>
                      Seen by {item.seenCount ?? 0} of {item.audienceCount ?? 0} guardians · {item.authorName}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Detail pane */}
        <div className={`${openId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col lg:flex`}>
          {openId ? (
            <AnnouncementDetail
              key={openId}
              announcementId={openId}
              tone={tone}
              version={version}
              onEdit={(d) => setComposer({ mode: 'edit', existing: d })}
              onDelete={setDeleting}
              onBack={() => setOpen(null)}
              onChanged={() => void load(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
              <MegaphoneIcon className="h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-600">Pick an announcement</p>
              <p className="max-w-xs text-xs text-slate-400">See who has read it, who was emailed, and edit or remove it.</p>
            </div>
          )}
        </div>
      </div>

      <AnnouncementComposerModal
        isOpen={composer !== null}
        onClose={() => setComposer(null)}
        tone={tone}
        mode={composer?.mode ?? 'create'}
        existing={composer?.existing ?? null}
        presetClassId={classId || presetClassId}
        onSaved={onSaved}
      />
      <DeleteAnnouncementModal isOpen={deleting !== null} onClose={() => setDeleting(null)} item={deleting} onDeleted={onDeleted} />
    </>
  )
}

export default AnnouncementsPanel
