'use client'

// Settings → Class options: how many students are left out of the class
// average, and the button that opens "Who counts in the class average" (the
// gradebook's window). The roster and assessments load when it opens.

import React, { useState } from 'react'
import ClassStatsModal from '@/components/gradebook/classStats/ClassStatsModal'
import { useStatsExclusions } from '@/hooks/useStatsExclusions'
import { leftOutSummary } from '@/lib/classStats'
import { getAssessmentsByClass, getStudentsInClass } from '@/services/classService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPayload } from '@/services/types/assessment'

interface ClassStatsRowProps {
  classId: string
  canEdit: boolean
}

export default function ClassStatsRow({ classId, canEdit }: ClassStatsRowProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const exclusions = useStatsExclusions(classId)
  const [roster, setRoster] = useState<{ students: StudentPayload[]; assessments: AssessmentPayload[] } | null>(null)
  const [opening, setOpening] = useState(false)

  const open = async () => {
    setOpening(true)
    try {
      const [stu, assess] = await Promise.all([getStudentsInClass(classId), getAssessmentsByClass(classId)])
      if (stu.status !== 'success' || assess.status !== 'success') throw new Error(stu.message || assess.message)
      setRoster({ students: stu.data, assessments: assess.data })
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "The class list couldn't be loaded. Try again.", 'error')
    } finally {
      setOpening(false)
    }
  }

  const summary = leftOutSummary(exclusions.exclusions)

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-slate-800">
      <span>
        Who counts in the class average
        <span className="block text-xs text-slate-500">{exclusions.loading ? 'Loading…' : summary}</span>
      </span>
      <button
        type="button"
        onClick={() => void open()}
        disabled={opening}
        className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      >
        {opening ? 'Opening…' : canEdit ? 'Manage' : 'View'}
      </button>
      {roster && (
        <ClassStatsModal
          isOpen
          onClose={() => setRoster(null)}
          students={roster.students}
          assessments={roster.assessments}
          exclusions={exclusions}
          readOnly={!canEdit}
        />
      )}
    </div>
  )
}
