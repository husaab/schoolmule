'use client'

import React from 'react'
import { BuildingLibraryIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import type { AnnouncementChild, AnnouncementItem } from '@/services/types/announcement'
import ChildAvatar from '@/components/parent/ChildAvatar'
import type { Tone } from '@/components/messaging/tones'

interface Props {
  item: Pick<AnnouncementItem, 'scope' | 'scopeLabel' | 'isPinned'>
  tone: Tone
  /** Parent surfaces: the child this post reaches, shown with their avatar. */
  child?: AnnouncementChild | null
}

/** "Amina · Gr 6 Math" / "Grade 6" / "Whole school" / "Selected families", plus the pin marker. */
const AnnouncementScopeChip: React.FC<Props> = ({ item, tone, child }) => {
  const staff = tone === 'staff'
  const accent = staff ? 'border-cyan-200 bg-cyan-50 text-cyan-800' : 'border-amber-200 bg-amber-50 text-amber-800'
  const neutral = staff ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-stone-200 bg-stone-100 text-stone-600'
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border py-px pr-2 text-[11px] font-medium ${
          item.scope === 'school' ? `${neutral} pl-2` : `${accent} ${child ? 'pl-0.5' : 'pl-2'}`
        }`}
      >
        {item.scope === 'school' && <BuildingLibraryIcon className="h-3 w-3" />}
        {item.scope === 'custom' && !child && <UsersIcon className="h-3 w-3" />}
        {child && <ChildAvatar studentId={child.studentId} name={child.name} size={16} />}
        {child ? `${child.name.split(' ')[0]} · ${item.scopeLabel}` : item.scopeLabel}
      </span>
      {item.isPinned && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <MapPinIcon className="h-3 w-3" /> Pinned
        </span>
      )}
    </span>
  )
}

export default AnnouncementScopeChip
