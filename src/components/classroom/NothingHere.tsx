// src/components/classroom/NothingHere.tsx
// The empty state of a tab with nothing in it yet ("Nothing here yet."): the
// student's and parent's Classwork tab until the classwork list arrives.
'use client'

export default function NothingHere({ message = 'Nothing here yet.' }: { message?: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-[15px] text-slate-500">
      {message}
    </p>
  )
}
