// src/components/avatar/PickAvatarCard.tsx
// The gentle nudge on a home page for someone still showing the neutral
// avatar (Photos board, "Before someone picks").
'use client'

import Avatar from './Avatar'

export default function PickAvatarCard({ onPick }: { onPick: () => void }) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-slate-200/70 bg-white p-5">
      <Avatar name="Neutral avatar" size={64} neutral />
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-slate-900">Pick your avatar</h2>
        <p className="text-[13px] leading-relaxed text-slate-600">
          Choose how you look in SchoolMule. You can change it any time.
        </p>
      </div>
      <button
        type="button"
        onClick={onPick}
        className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Pick my avatar
      </button>
    </section>
  )
}
