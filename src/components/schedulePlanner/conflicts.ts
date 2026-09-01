// Conflict detection for the manual schedule builder. The solver guarantees
// conflict-free output; hand-placed sessions do not, so the builder flags
// clashes inline instead of blocking the edit — an admin mid-rearrange often
// passes through an invalid state on the way to a valid one.

import type { ScheduleSession } from '@/services/types/schedulePlanner'
import { sessionKey } from '@/store/useSchedulePlannerStore'

export interface ConflictReport {
  /** Session key → human-readable reasons it clashes. */
  byKey: Map<string, string[]>
  count: number
}

const overlaps = (a: ScheduleSession, b: ScheduleSession) =>
  a.day === b.day && a.startMin < b.endMin && b.startMin < a.endMin

/** Pairwise scan: a school week is a few hundred sessions, so O(n²) is fine. */
export function findConflicts(
  sessions: ScheduleSession[],
  names: {
    teacher: (id: string) => string
    group: (id: string) => string
    room: (id?: string | null) => string | null
  }
): ConflictReport {
  const byKey = new Map<string, string[]>()

  const add = (s: ScheduleSession, reason: string) => {
    const key = sessionKey(s)
    const reasons = byKey.get(key) ?? []
    if (!reasons.includes(reason)) reasons.push(reason)
    byKey.set(key, reasons)
  }

  for (let i = 0; i < sessions.length; i += 1) {
    for (let j = i + 1; j < sessions.length; j += 1) {
      const a = sessions[i]
      const b = sessions[j]
      if (!overlaps(a, b)) continue

      if (a.teacherId === b.teacherId) {
        const reason = `${names.teacher(a.teacherId)} is teaching two classes at once`
        add(a, reason)
        add(b, reason)
      }
      if (a.classGroupId === b.classGroupId) {
        const reason = `${names.group(a.classGroupId)} has two classes at once`
        add(a, reason)
        add(b, reason)
      }
      if (a.roomId && a.roomId === b.roomId) {
        const reason = `${names.room(a.roomId)} is double-booked`
        add(a, reason)
        add(b, reason)
      }
    }
  }

  return { byKey, count: byKey.size }
}
