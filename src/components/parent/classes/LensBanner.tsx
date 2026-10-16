// src/components/parent/classes/LensBanner.tsx
// The bar across the top of the parent's lens (Parent-Lens board): it says
// whose classes these are and that this is read-only, and takes the parent
// back to all their children.
'use client'

import { EyeIcon } from '@heroicons/react/24/outline'
import { lensBannerText } from '@/lib/classroomText'

interface LensBannerProps {
  childName: string
  onBack: () => void
}

export default function LensBanner({ childName, onBack }: LensBannerProps) {
  const text = lensBannerText(childName)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3.5 text-amber-950">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
        <EyeIcon className="h-[22px] w-[22px] shrink-0 text-amber-700" aria-hidden="true" />
        <span>
          {text.lead}
          <strong className="font-semibold">{text.name}</strong>
          {text.tail}
        </span>
        <span className="rounded-full border border-amber-200 bg-white px-[9px] py-[3px] text-xs font-semibold text-amber-800">Read-only</span>
      </span>
      <button
        type="button"
        onClick={onBack}
        className="min-h-10 cursor-pointer text-sm font-medium text-amber-800 underline-offset-2 hover:text-amber-950 hover:underline"
      >
        Back to all children
      </button>
    </div>
  )
}
