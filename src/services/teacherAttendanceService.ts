import apiClient from "./apiClient";
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

/** My hours so far in the period paid on the next pay day (null without a schedule). */
export const getMyPayPeriod = () => apiClient<MyPayPeriodResponse>(`${BASE}/me/pay-period`);

export const updateMyRecord = (date: string, status: "PRESENT" | "ABSENT", notes?: string | null) =>
  apiClient<UpdateRecordResponse>(`${BASE}/me/${date}`, {
    method: "PATCH",
    body: { status, notes: notes ?? null },
  });

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
