// src/services/parentClassroomService.ts
// The parent's Classes page and read-only lens. Every per-child call is
// checked on the server against the parent's own children; nothing here can
// reach another family's child.

import apiClient from './apiClient';
import type { NotificationPrefs, NotificationPrefsChange, ParentClassroomSummary } from './types/parentClassroom';
import type {
  ChildGrades,
  StudentClassCard,
  StudentClasswork,
  StudentClassPage,
  StudentClassStream,
  StudentItem,
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

/** The child's Classwork for one class: topics, items with the child's status, what is coming up. Read-only. */
export const getLensClasswork = (studentId: string, classId: string) =>
  apiClient<StudentPortalEnvelope<StudentClasswork>>(`${lens(studentId)}/classes/${encodeURIComponent(classId)}/classwork`);

/** One piece of the child's work: the item, the child's files and typed answer, the grade. Nothing here can be changed. */
export const getLensItem = (studentId: string, itemId: string) =>
  apiClient<StudentPortalEnvelope<StudentItem>>(`${lens(studentId)}/items/${encodeURIComponent(itemId)}`);

/** A link to one of the child's own files, good for an hour. */
export const getLensFileUrl = (studentId: string, fileId: string) =>
  apiClient<StudentPortalEnvelope<{ url: string }>>(`${lens(studentId)}/files/${encodeURIComponent(fileId)}/url`);

/** GET /parent-portal/notification-prefs: the weekly (or daily) summary and missing-work alert choices. */
export const getNotificationPrefs = () =>
  apiClient<StudentPortalEnvelope<NotificationPrefs>>('/parent-portal/notification-prefs');

/** PUT /parent-portal/notification-prefs: any of the keys (the rest keep their value). Answers with the saved choices. */
export const saveNotificationPrefs = (change: NotificationPrefsChange) =>
  apiClient<StudentPortalEnvelope<NotificationPrefs>, NotificationPrefsChange>('/parent-portal/notification-prefs', {
    method: 'PUT',
    body: change,
  });
