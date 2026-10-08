'use client'

// Drop one assessment from one student's grade, or count it again. Shared by
// the score-grid modals so the round trip, the toasts and the "busy" state
// behave the same everywhere.

import { useState } from 'react'
import { createExclusion, deleteExclusion } from '@/services/excludedAssessmentService'
import { useNotificationStore } from '@/store/useNotificationStore'

interface UseExclusionToggleArgs {
  classId: string
  /** Re-fetches the score matrix so is_excluded flips in the grid. */
  onRefreshExclusions: () => Promise<void>
}

export function useExclusionToggle({ classId, onRefreshExclusions }: UseExclusionToggleArgs) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // "studentId|assessmentId" of the cell mid round-trip, so it can show a spinner.
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const toggle = async (studentId: string, assessmentId: string, isExcluded: boolean) => {
    const key = `${studentId}|${assessmentId}`
    setTogglingKey(key)
    try {
      if (isExcluded) {
        await deleteExclusion(studentId, classId, assessmentId)
        showNotification('Assessment included', 'success')
      } else {
        await createExclusion({ studentId, classId, assessmentId })
        showNotification('Assessment excluded', 'success')
      }
      await onRefreshExclusions()
    } catch (error) {
      console.error('Error toggling exclusion:', error)
      showNotification('Failed to update exclusion', 'error')
    } finally {
      setTogglingKey(null)
    }
  }

  return { togglingKey, toggle }
}
