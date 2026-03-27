import apiClient from "./apiClient";
import {
  TodayStatusResponse,
  CheckInResponse,
  MyMonthResponse,
  AllTeachersResponse,
  UpdateRecordResponse,
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

export const updateMyRecord = (date: string, status: "PRESENT" | "ABSENT", notes?: string | null) =>
  apiClient<UpdateRecordResponse>(`${BASE}/me/${date}`, {
    method: "PATCH",
    body: { status, notes: notes ?? null },
  });

export const getAllTeacherAttendance = (school: string, month: string) =>
  apiClient<AllTeachersResponse>(
    `${BASE}?school=${encodeURIComponent(school)}&month=${encodeURIComponent(month)}`
  );

export const updateTeacherRecord = (
  teacherId: string,
  date: string,
  status: "PRESENT" | "ABSENT",
  notes?: string | null
) =>
  apiClient<UpdateRecordResponse>(`${BASE}/${teacherId}/${date}`, {
    method: "PATCH",
    body: { status, notes: notes ?? null },
  });

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
