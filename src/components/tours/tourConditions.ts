// What holds for the signed-in person right now, for tours that wait on it
// (lib/tours TourCondition, Audience.when). Each condition reads a store a
// page already loads: the meetings store is loaded by the sidebar for every
// parent and staff member, the same data that shows Meetings / My Meetings.
'use client'
import { useMemo } from 'react'
import type { TourCondition } from '@/lib/tours'
import { useMeetingsStore } from '@/store/useMeetingsStore'
import { useUserStore } from '@/store/useUserStore'

export function useTourConditions(): readonly TourCondition[] {
  const role = useUserStore((s) => s.user.role)
  const parentEvents = useMeetingsStore((s) => s.parentEvents)
  const teacherEvents = useMeetingsStore((s) => s.teacherEvents)
  return useMemo(() => {
    const held: TourCondition[] = []
    if (role === 'PARENT' && parentEvents.some((e) => e.phase === 'open')) held.push('meetings-booking')
    if (role !== 'PARENT' && role !== 'STUDENT' && teacherEvents.some((e) => e.takingPart)) held.push('meetings-teaching')
    return held
  }, [role, parentEvents, teacherEvents])
}
