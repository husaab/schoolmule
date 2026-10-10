'use client'

// Mark one cell missing (counts as 0), excused (never counts) or back to
// graded. Shared by the gradebook grid and the score-grid modals so the round
// trip, the toasts and the "busy" state behave the same everywhere. A category
// assessment id applies the status to every item inside it.

import { useState } from 'react'
import { setScoreStatus } from '@/services/classService'
import type { ScoreStatus } from '@/lib/gradeEngine'
import { useNotificationStore } from '@/store/useNotificationStore'

interface UseCellStatusArgs {
  classId: string
  /** Re-fetches the score matrix so the new status shows in the grid. */
  onRefresh: () => Promise<void> | void
}

const SUCCESS_COPY: Record<ScoreStatus, string> = {
  missing: 'Marked missing — counts as 0',
  excused: 'Excused — no longer counts',
  graded: 'Status cleared',
}

export function useCellStatus({ classId, onRefresh }: UseCellStatusArgs) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // "studentId|assessmentId" of the cell mid round-trip, so it can show a spinner.
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const setStatus = async (studentId: string, assessmentId: string, status: ScoreStatus) => {
    const key = `${studentId}|${assessmentId}`
    setTogglingKey(key)
    try {
      await setScoreStatus(classId, { studentId, assessmentId, status })
      showNotification(SUCCESS_COPY[status], 'success')
      await onRefresh()
    } catch (error) {
      console.error('Error updating cell status:', error)
      showNotification('Failed to update status', 'error')
    } finally {
      setTogglingKey(null)
    }
  }

  return { togglingKey, setStatus }
}
