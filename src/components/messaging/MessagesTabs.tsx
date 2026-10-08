'use client'

// The page-level switch between Conversations and Announcements shared by
// the staff, parent and admin messaging pages. The active tab lives in the
// URL (?tab=) so emails and the bell can deep-link to either side.

import React, { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toneClasses, type Tone } from './tones'

export type MessagesTab = 'conversations' | 'announcements'

/** Reads ?tab= and gives back a setter that keeps the other params but drops thread/announcement. */
export function useMessagesTab(defaultTab: MessagesTab): [MessagesTab, (t: MessagesTab) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const tab: MessagesTab = raw === 'announcements' || raw === 'conversations' ? raw : defaultTab
  const setTab = useCallback(
    (t: MessagesTab) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', t)
      params.delete('thread')
      params.delete('announcement')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )
  return [tab, setTab]
}

interface MessagesTabsProps {
  tone: Tone
  active: MessagesTab
  onChange: (t: MessagesTab) => void
  counts: { conversations: number; announcements: number }
  order?: MessagesTab[]
}

const LABEL: Record<MessagesTab, string> = { conversations: 'Conversations', announcements: 'Announcements' }

const MessagesTabs: React.FC<MessagesTabsProps> = ({ tone, active, onChange, counts, order = ['conversations', 'announcements'] }) => {
  const t = toneClasses(tone)
  const activeText = tone === 'parent' ? 'border-amber-700 text-amber-800' : 'border-cyan-600 text-cyan-700'
  return (
    <div role="tablist" aria-label="Messages sections" className={`flex gap-1 border-b ${tone === 'parent' ? 'border-stone-200' : 'border-slate-200'}`}>
      {order.map((tab) => {
        const n = counts[tab]
        const isActive = tab === active
        return (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
              isActive ? `font-medium ${activeText}` : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {LABEL[tab]}
            {n > 0 && (
              <span
                className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                  isActive ? t.badge : 'bg-slate-100 text-slate-600'
                }`}
              >
                {n > 99 ? '99+' : n}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default MessagesTabs
