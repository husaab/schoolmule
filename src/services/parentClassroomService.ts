// src/services/parentClassroomService.ts
// The parent's Classes page and read-only lens. Every per-child call is
// checked on the server against the parent's own children; nothing here can
// reach another family's child.

import apiClient from './apiClient';
import type { ParentClassroomSummary } from './types/parentClassroom';
import type {
  ChildGrades,
  StudentClassCard,
  StudentClassPage,
  StudentClassStream,
  StudentPortalEnvelope,
} from './types/studentPortal';

const lens = (studentId: string) => `/parent-portal/students/${encodeURIComponent(studentId)}/classroom`;

/** GET /parent-portal/classroom/summary: "Needs you" and one card per child. */
export const getClassroomSummary = () =>
  apiClient<StudentPortalEnvelope<ParentClassroomSummary>>('/parent-portal/classroom/summary');

/** The child's classes, the way the child sees them. */
export const getLensClasses = (studentId: string) =>
  apiClient<StudentPortalEnvelope<{ classes: StudentClassCard[] }>>(`${lens(studentId)}/classes`);

/** One class of the child: header and what is coming up. */
export const getLensClass = (studentId: string, classId: string) =>
  apiClient<StudentPortalEnvelope<StudentClassPage>>(`${lens(studentId)}/classes/${encodeURIComponent(classId)}`);

/** The class Stream, with the parent's own read and "Got it" state. */
export const getLensStream = (studentId: string, classId: string) =>
  apiClient<StudentPortalEnvelope<StudentClassStream>>(`${lens(studentId)}/classes/${encodeURIComponent(classId)}/stream`);

/** The child's published grades. */
export const getLensGrades = (studentId: string, termId?: string) =>
  apiClient<StudentPortalEnvelope<ChildGrades>>(
    `${lens(studentId)}/grades${termId ? `?termId=${encodeURIComponent(termId)}` : ''}`,
  );
