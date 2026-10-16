// src/services/studentAccountService.ts
// Admin Panel → Student accounts. Admin only; the backend takes the school
// from the token and the year from X-School-Year, and answers 404 for a
// student of another school.

import apiClient from './apiClient';
import { postForPdf } from '@/lib/pdfDownload';
import { readSkipped } from '@/lib/studentAccounts';
import type {
  InviteResponse,
  StudentAccountEnvelope,
  StudentAccountList,
  StudentAccountRow,
  UnlinkedStudentUser,
} from './types/studentAccount';

const BASE = '/admin/student-accounts';

/** GET: the selected year's students with their login status, plus the classroom settings. */
export const getStudentAccounts = () => apiClient<StudentAccountEnvelope<StudentAccountList>>(BASE);

/**
 * PATCH the student's own address. With a login, the sign-in address changes
 * too and any open invite or password link dies. null removes the address
 * (refused once the student has a login).
 */
export const updateStudentEmail = (studentId: string, studentEmail: string | null) =>
  apiClient<StudentAccountEnvelope<StudentAccountRow>, { studentEmail: string | null }>(`${BASE}/${studentId}`, {
    method: 'PATCH',
    body: { studentEmail },
  });

/**
 * POST /invite for one batch (1–200 ids). The server sends one email every
 * ~600 ms, so callers send small batches (INVITE_BATCH_SIZE) and show progress.
 */
export const inviteStudents = (studentIds: string[], noticeVersion: string) =>
  apiClient<
    StudentAccountEnvelope<InviteResponse>,
    { studentIds: string[]; consentConfirmed: true; noticeVersion: string }
  >(`${BASE}/invite`, {
    method: 'POST',
    body: { studentIds, consentConfirmed: true, noticeVersion },
  });

export const resendStudentInvite = (studentId: string) =>
  apiClient<StudentAccountEnvelope<{ sent: true }>>(`${BASE}/${studentId}/resend-invite`, { method: 'POST' });

/** A fresh 7-day password link; older links stop working. */
export const resetStudentPassword = (studentId: string) =>
  apiClient<StudentAccountEnvelope<{ sent: true }>>(`${BASE}/${studentId}/reset-password`, { method: 'POST' });

/** Keeps every record; the login stops working and the QR card is voided. */
export const archiveStudentAccount = (studentId: string) =>
  apiClient<StudentAccountEnvelope<StudentAccountRow>>(`${BASE}/${studentId}/archive`, { method: 'POST' });

export const unarchiveStudentAccount = (studentId: string) =>
  apiClient<StudentAccountEnvelope<StudentAccountRow>>(`${BASE}/${studentId}/unarchive`, { method: 'POST' });

/** Student logins with no student row linked this school year (the relink picker). */
export const getUnlinkedStudentAccounts = () =>
  apiClient<StudentAccountEnvelope<UnlinkedStudentUser[]>>(`${BASE}/unlinked`);

export const linkStudentAccount = (studentId: string, userId: string) =>
  apiClient<StudentAccountEnvelope<StudentAccountRow>, { userId: string }>(`${BASE}/${studentId}/link`, {
    method: 'POST',
    body: { userId },
  });

/** Removes this year's link only; the login is kept and can be linked again. */
export const unlinkStudentAccount = (studentId: string) =>
  apiClient<StudentAccountEnvelope<StudentAccountRow>>(`${BASE}/${studentId}/link`, { method: 'DELETE' });

/** Deletes the login with its consent record and every year's link (409 while active). */
export const deleteStudentAccount = (studentId: string) =>
  apiClient<StudentAccountEnvelope<{ deleted: true }>>(`${BASE}/${studentId}/account`, { method: 'DELETE' });

/** Void the live QR cards of these students (1–200 ids). */
export const voidQrCards = (studentIds: string[]) =>
  apiClient<StudentAccountEnvelope<{ voided: number }>, { studentIds: string[] }>(`${BASE}/qr/void`, {
    method: 'POST',
    body: { studentIds },
  });

/**
 * Print QR sign-in cards for 1–200 students and save the PDF. Printing always
 * reissues: each printed card voids that student's older one. Resolves to how
 * many students got no card (and, for a short list, which).
 */
export const printQrCards = async (studentIds: string[], filename = 'student-cards.pdf') => {
  const headers = await postForPdf(`${BASE}/cards.pdf`, { studentIds }, filename);
  return readSkipped(headers);
};
