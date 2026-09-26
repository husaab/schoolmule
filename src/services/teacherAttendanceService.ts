import apiClient from "./apiClient";
import type {
  SheetLinkResponse,
  LinkResponse,
  MessageResponse,
  SheetTarget,
} from "./types/googleSheets";
import {
  TodayStatusResponse,
  CheckInResponse,
  MyMonthResponse,
  MyPayPeriodResponse,
  AllTeachersResponse,
  UpdateRecordResponse,
  WorkDaysResponse,
  HoursPerDayResponse,
  PayScheduleResponse,
  PaySchedulePayload,
  PayPeriodsResponse,
  DeleteRecordResponse,
} from "./types/teacherAttendance";

const BASE = "/teacher-attendance";

export const getTodayStatus = (date: string) =>
  apiClient<TodayStatusResponse>(`${BASE}/today?date=${encodeURIComponent(date)}`);

export const checkIn = (status: "PRESENT" | "ABSENT", date: string, notes?: string | null) =>
  apiClient<CheckInResponse>(`${BASE}/checkin`, {
    method: "POST",
    body: { status, date, notes: notes ?? null },
  });

export const getMyMonth = (month: string) =>
  apiClient<MyMonthResponse>(`${BASE}/me?month=${encodeURIComponent(month)}`);

/**
 * My hours in the period paid on the next pay day (null without a schedule).
 * Pass a date to get the period containing it instead — e.g. a past pay day.
 */
export const getMyPayPeriod = (date?: string) =>
  apiClient<MyPayPeriodResponse>(
    `${BASE}/me/pay-period${date ? `?date=${encodeURIComponent(date)}` : ""}`
  );

export const updateMyRecord = (date: string, status: "PRESENT" | "ABSENT", notes?: string | null) =>
  apiClient<UpdateRecordResponse>(`${BASE}/me/${date}`, {
    method: "PATCH",
    body: { status, notes: notes ?? null },
  });

/** Remove what I recorded for a day; it then reads as unmarked (or assumed present). */
export const deleteMyRecord = (date: string) =>
  apiClient<DeleteRecordResponse>(`${BASE}/me/${date}`, { method: "DELETE" });

export const getAllTeacherAttendance = (school: string, month: string) =>
  apiClient<AllTeachersResponse>(
    `${BASE}?school=${encodeURIComponent(school)}&month=${encodeURIComponent(month)}`
  );

/** Admin: set a day's status, note and — optionally — the hours it is worth (null = usual day). */
export const updateTeacherRecord = (
  teacherId: string,
  date: string,
  status: "PRESENT" | "ABSENT",
  notes?: string | null,
  hours?: number | null
) =>
  apiClient<UpdateRecordResponse>(`${BASE}/${teacherId}/${date}`, {
    method: "PATCH",
    body: { status, notes: notes ?? null, hours: hours ?? null },
  });

/** Admin: remove a day's record for anyone. */
export const deleteTeacherRecord = (teacherId: string, date: string) =>
  apiClient<DeleteRecordResponse>(`${BASE}/${teacherId}/${date}`, { method: "DELETE" });

/** Admin: set which weekdays a staff member works (ISO, Monday = 1). */
export const setWorkDays = (teacherId: string, workDays: number[]) =>
  apiClient<WorkDaysResponse>(`${BASE}/work-days/${teacherId}`, {
    method: "PUT",
    body: { workDays },
  });

/** Admin: drop the override so work days come from the schedule planner again. */
export const resetWorkDays = (teacherId: string) =>
  apiClient<WorkDaysResponse>(`${BASE}/work-days/${teacherId}`, { method: "DELETE" });

/** Admin: how many hours one of this person's work days is worth. */
export const setHoursPerDay = (teacherId: string, hoursPerDay: number) =>
  apiClient<HoursPerDayResponse>(`${BASE}/hours-per-day/${teacherId}`, {
    method: "PUT",
    body: { hoursPerDay },
  });

/** Admin: back to the school's default hours per day. */
export const resetHoursPerDay = (teacherId: string) =>
  apiClient<HoursPerDayResponse>(`${BASE}/hours-per-day/${teacherId}`, { method: "DELETE" });

// ─── Pay schedule ──────────────────────────────────────────────────────────

/** Any staff member: the school's pay schedule and the period we are in now. */
export const getPaySchedule = () => apiClient<PayScheduleResponse>(`${BASE}/pay-schedule`);

/** Admin: create or replace the school's pay schedule. */
export const savePaySchedule = (payload: PaySchedulePayload) =>
  apiClient<PayScheduleResponse>(`${BASE}/pay-schedule`, { method: "PUT", body: payload });

/** Admin: remove the pay schedule (hours stay, pay periods go). */
export const deletePaySchedule = () =>
  apiClient<PayScheduleResponse>(`${BASE}/pay-schedule`, { method: "DELETE" });

/** Admin: every pay period whose pay day lands in the month, with hours per teacher. */
export const getPayPeriodsForMonth = (month: string, teacherId?: string) =>
  apiClient<PayPeriodsResponse>(
    `${BASE}/pay-periods?month=${encodeURIComponent(month)}` +
      (teacherId ? `&teacherId=${encodeURIComponent(teacherId)}` : "")
  );

/** Admin: the single pay period containing a date (today when omitted). */
export const getPayPeriodContaining = (date?: string, teacherId?: string) => {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (teacherId) params.set("teacherId", teacherId);
  const qs = params.toString();
  return apiClient<PayPeriodsResponse>(`${BASE}/pay-periods${qs ? `?${qs}` : ""}`);
};

export const downloadAttendancePDF = async (
  school: string,
  month: string,
  teacherId?: string
) => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  let url = `${baseURL}${BASE}/pdf?school=${encodeURIComponent(school)}&month=${encodeURIComponent(month)}`;
  if (teacherId) {
    url += `&teacherId=${encodeURIComponent(teacherId)}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to download PDF");

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Staff_Attendance_${school}_${month}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ─── Staff hours → Google Sheet (admin) ────────────────────────────────────

/** The school's linked staff-hours spreadsheet, its connection, and sync state. */
export const getStaffHoursSheet = () => apiClient<SheetLinkResponse>(`${BASE}/sheet`);

/** Link a spreadsheet picked from Drive, or have one created. Queues the first sync. */
export const linkStaffHoursSheet = (body: { spreadsheetId: string } | { createNew: true; title?: string }) =>
  apiClient<LinkResponse>(`${BASE}/sheet`, { method: "PUT", body });

/** Forget the link. The spreadsheet itself is left untouched. */
export const unlinkStaffHoursSheet = () =>
  apiClient<MessageResponse>(`${BASE}/sheet`, { method: "DELETE" });

export const syncStaffHoursSheet = () =>
  apiClient<MessageResponse>(`${BASE}/sheet/sync`, { method: "POST" });

/** The school's staff hours as a target for the shared Google Sheet UI. */
export const staffHoursSheetTarget = (): SheetTarget => ({
  key: "staff-hours",
  getLink: getStaffHoursSheet,
  linkExisting: (spreadsheetId) => linkStaffHoursSheet({ spreadsheetId }),
  linkNew: () => linkStaffHoursSheet({ createNew: true }),
  unlink: unlinkStaffHoursSheet,
  syncNow: syncStaffHoursSheet,
  returnTo: "/staff-attendance",
  copy: {
    connectPitch:
      "Keep a spreadsheet of everyone's hours up to date on its own — an Overview tab plus one tab per pay day — instead of downloading a PDF each time.",
    tabNote:
      "You get an Overview tab (hours by pay day) and one tab per pay day from the start of this school year, with a column for every date. New pay days add their own tab.",
    ownedNote: () =>
      "We keep the Overview and every pay-day tab up to date, from the first column through the last date column. Anything you add to the right of those, or on your own tabs, is yours — we never read or change it. Changing the pay schedule starts new tabs; old ones are left as they were.",
    pillTitle: "Keep a Google Sheet of staff hours by pay day up to date",
    unlinkConfirm:
      "Unlink this sheet? The spreadsheet and everything in it stays exactly as it is — we just stop updating it.",
  },
});
