// src/components/studentPortal/useStudentBadges.ts
// What the student shell shows beside its nav items and under "My classes".
// The nav badges stay empty until the To-do and Messages arrive (later tasks
// fill them); the class list is the student's current-term classes.

import { useMemo } from 'react'
import { studentClassHref } from '@/lib/portalRoutes'
import type { StudentBadgeKey, StudentClassLink } from './studentNav'
import { useStudentClasses } from './useStudentClasses'

/** Counts for nav badges, keyed by StudentNavItem.badgeKey. */
export const useStudentBadges = (): Partial<Record<StudentBadgeKey, number>> => ({})

const NO_CLASSES: StudentClassLink[] = []

/** The sidebar's "My classes" links. */
export const useStudentClassLinks = (): StudentClassLink[] => {
  const { classes } = useStudentClasses()
  return useMemo(
    () =>
      classes
        ? classes.map((c) => ({ href: studentClassHref(c.classId), label: c.subject, iconUrl: c.identity.iconUrl }))
        : NO_CLASSES,
    [classes],
  )
}
