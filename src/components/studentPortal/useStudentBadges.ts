// src/components/studentPortal/useStudentBadges.ts
// What the student shell shows beside its nav items and under "My classes".
// Both are empty until the portal has classes and work (later tasks fill them).

import type { StudentBadgeKey, StudentClassLink } from './studentNav'

/** Counts for nav badges, keyed by StudentNavItem.badgeKey. */
export const useStudentBadges = (): Partial<Record<StudentBadgeKey, number>> => ({})

const NO_CLASSES: StudentClassLink[] = []

/** The sidebar's "My classes" links. */
export const useStudentClassLinks = (): StudentClassLink[] => NO_CLASSES
