// src/components/gradebook/workspace/ClassTermNotice.tsx
// JK/SK gradebook: says so when this class is set to a term that isn't the
// current one, since everything entered here saves to the class's term
// (lib/classTermNotice.ts). Shows nothing while loading or if terms can't load.
'use client'

import { useEffect, useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { getTermsBySchool } from '@/services/termService'
import { classTermNotice, classTermNoticeText, type ClassTermNotice as Notice } from '@/lib/classTermNotice'

export default function ClassTermNotice({ termId, school }: { termId: string | null | undefined; school: string | null | undefined }) {
  // The answer is kept with the class term it is for, so another class's
  // notice never shows while this one's terms load.
  const [loaded, setLoaded] = useState<{ termId: string; notice: Notice | null } | null>(null)

  useEffect(() => {
    if (!termId || !school) return
    let live = true
    getTermsBySchool(school)
      .then((res) => {
        if (live) setLoaded({ termId, notice: classTermNotice(termId, res.data ?? [], new Date().toLocaleDateString('en-CA')) })
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [termId, school])

  const notice = loaded && loaded.termId === termId ? loaded.notice : null
  if (!notice) return null
  const { title, body } = classTermNoticeText(notice)
  return (
    <div role="status" className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none text-amber-500" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5">{body}</p>
      </div>
    </div>
  )
}
