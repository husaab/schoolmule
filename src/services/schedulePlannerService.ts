// File: src/services/schedulePlannerService.ts
// Admin Schedule Planner API (all endpoints are school-scoped by the JWT).

import apiClient from './apiClient';
import type {
  ApiResponse,
  ClassGroup,
  CourseRequirement,
  DayTemplate,
  FixedBlock,
  GenerateFailureData,
  GenerateRequest,
  GenerateResult,
  PlannerConfig,
  PlannerRoom,
  PlannerSettings,
  PlannerTeacher,
  PublishedSession,
  ScheduleDraft,
  ScheduleSession,
  ScheduleSummary,
} from './types/schedulePlanner';

const BASE = '/schedule-planner';

// ─── Config & settings ────────────────────────────────────────────────────

export const getPlannerConfig = async (): Promise<ApiResponse<PlannerConfig>> =>
  apiClient<ApiResponse<PlannerConfig>>(`${BASE}/config`);

export const updatePlannerSettings = async (
  payload: Partial<PlannerSettings>
): Promise<ApiResponse<PlannerSettings>> =>
  apiClient<ApiResponse<PlannerSettings>, Partial<PlannerSettings>>(`${BASE}/settings`, {
    method: 'PATCH',
    body: payload,
  });

// ─── Teachers ─────────────────────────────────────────────────────────────

export type TeacherInput = Partial<Omit<PlannerTeacher, 'plannerTeacherId' | 'school'>>;

export const createPlannerTeacher = async (
  payload: TeacherInput
): Promise<ApiResponse<PlannerTeacher>> =>
  apiClient<ApiResponse<PlannerTeacher>, TeacherInput>(`${BASE}/teachers`, {
    method: 'POST',
    body: payload,
  });

export const updatePlannerTeacher = async (
  teacherId: string,
  payload: TeacherInput
): Promise<ApiResponse<PlannerTeacher>> =>
  apiClient<ApiResponse<PlannerTeacher>, TeacherInput>(
    `${BASE}/teachers/${encodeURIComponent(teacherId)}`,
    { method: 'PATCH', body: payload }
  );

export const deletePlannerTeacher = async (
  teacherId: string
): Promise<ApiResponse<PlannerTeacher>> =>
  apiClient<ApiResponse<PlannerTeacher>>(`${BASE}/teachers/${encodeURIComponent(teacherId)}`, {
    method: 'DELETE',
  });

// ─── Rooms ────────────────────────────────────────────────────────────────

export type RoomInput = { name?: string; capacityNote?: string | null };

export const createPlannerRoom = async (payload: RoomInput): Promise<ApiResponse<PlannerRoom>> =>
  apiClient<ApiResponse<PlannerRoom>, RoomInput>(`${BASE}/rooms`, {
    method: 'POST',
    body: payload,
  });

export const updatePlannerRoom = async (
  roomId: string,
  payload: RoomInput
): Promise<ApiResponse<PlannerRoom>> =>
  apiClient<ApiResponse<PlannerRoom>, RoomInput>(`${BASE}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PATCH',
    body: payload,
  });

export const deletePlannerRoom = async (roomId: string): Promise<ApiResponse<PlannerRoom>> =>
  apiClient<ApiResponse<PlannerRoom>>(`${BASE}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
  });

// ─── Class groups & courses ───────────────────────────────────────────────

export type ClassGroupInput = { name?: string; grade?: string | null; sortOrder?: number };

export const createClassGroup = async (
  payload: ClassGroupInput
): Promise<ApiResponse<ClassGroup>> =>
  apiClient<ApiResponse<ClassGroup>, ClassGroupInput>(`${BASE}/class-groups`, {
    method: 'POST',
    body: payload,
  });

export const updateClassGroup = async (
  classGroupId: string,
  payload: ClassGroupInput
): Promise<ApiResponse<ClassGroup>> =>
  apiClient<ApiResponse<ClassGroup>, ClassGroupInput>(
    `${BASE}/class-groups/${encodeURIComponent(classGroupId)}`,
    { method: 'PATCH', body: payload }
  );

export const deleteClassGroup = async (classGroupId: string): Promise<ApiResponse<ClassGroup>> =>
  apiClient<ApiResponse<ClassGroup>>(`${BASE}/class-groups/${encodeURIComponent(classGroupId)}`, {
    method: 'DELETE',
  });

export type CourseInput = Partial<Omit<CourseRequirement, 'courseId' | 'classGroupId'>>;

export const createCourse = async (
  classGroupId: string,
  payload: CourseInput
): Promise<ApiResponse<CourseRequirement>> =>
  apiClient<ApiResponse<CourseRequirement>, CourseInput>(
    `${BASE}/class-groups/${encodeURIComponent(classGroupId)}/courses`,
    { method: 'POST', body: payload }
  );

export const updateCourse = async (
  courseId: string,
  payload: CourseInput
): Promise<ApiResponse<CourseRequirement>> =>
  apiClient<ApiResponse<CourseRequirement>, CourseInput>(
    `${BASE}/courses/${encodeURIComponent(courseId)}`,
    { method: 'PATCH', body: payload }
  );

export const deleteCourse = async (courseId: string): Promise<ApiResponse<CourseRequirement>> =>
  apiClient<ApiResponse<CourseRequirement>>(`${BASE}/courses/${encodeURIComponent(courseId)}`, {
    method: 'DELETE',
  });

// ─── Day templates & fixed blocks ─────────────────────────────────────────

export const replaceDayTemplates = async (
  days: DayTemplate[]
): Promise<ApiResponse<DayTemplate[]>> =>
  apiClient<ApiResponse<DayTemplate[]>, { days: DayTemplate[] }>(`${BASE}/day-templates`, {
    method: 'PUT',
    body: { days },
  });

export type FixedBlockInput = Partial<Omit<FixedBlock, 'fixedBlockId'>>;

export const createFixedBlock = async (
  payload: FixedBlockInput
): Promise<ApiResponse<FixedBlock>> =>
  apiClient<ApiResponse<FixedBlock>, FixedBlockInput>(`${BASE}/fixed-blocks`, {
    method: 'POST',
    body: payload,
  });

export const updateFixedBlock = async (
  fixedBlockId: string,
  payload: FixedBlockInput
): Promise<ApiResponse<FixedBlock>> =>
  apiClient<ApiResponse<FixedBlock>, FixedBlockInput>(
    `${BASE}/fixed-blocks/${encodeURIComponent(fixedBlockId)}`,
    { method: 'PATCH', body: payload }
  );

export const deleteFixedBlock = async (fixedBlockId: string): Promise<ApiResponse<FixedBlock>> =>
  apiClient<ApiResponse<FixedBlock>>(`${BASE}/fixed-blocks/${encodeURIComponent(fixedBlockId)}`, {
    method: 'DELETE',
  });

// ─── Generate & schedules ─────────────────────────────────────────────────

export type GenerateOutcome =
  | { ok: true; result: GenerateResult }
  | { ok: false; message: string; failure: GenerateFailureData | null };

/**
 * POST /generate — custom fetch (not apiClient) so that 422 infeasibility
 * responses keep their full diagnostics payload instead of collapsing to a
 * single error message.
 */
export const generateSchedules = async (payload: GenerateRequest): Promise<GenerateOutcome> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (res.ok) {
    return { ok: true, result: body.data as GenerateResult };
  }
  return {
    ok: false,
    message: body.message || 'Failed to generate schedules',
    failure: res.status === 422 ? (body.data as GenerateFailureData) : null,
  };
};

export const listSchedules = async (): Promise<ApiResponse<ScheduleSummary[]>> =>
  apiClient<ApiResponse<ScheduleSummary[]>>(`${BASE}/schedules`);

export const getSchedule = async (scheduleId: string): Promise<ApiResponse<ScheduleDraft>> =>
  apiClient<ApiResponse<ScheduleDraft>>(`${BASE}/schedules/${encodeURIComponent(scheduleId)}`);

export type SaveScheduleInput = {
  name: string;
  sessions: ScheduleSession[];
  diagnostics?: unknown;
  configSnapshot?: unknown;
};

export const saveSchedule = async (
  payload: SaveScheduleInput
): Promise<ApiResponse<ScheduleDraft>> =>
  apiClient<ApiResponse<ScheduleDraft>, SaveScheduleInput>(`${BASE}/schedules`, {
    method: 'POST',
    body: payload,
  });

export const updateSchedule = async (
  scheduleId: string,
  payload: Partial<SaveScheduleInput>
): Promise<ApiResponse<ScheduleDraft>> =>
  apiClient<ApiResponse<ScheduleDraft>, Partial<SaveScheduleInput>>(
    `${BASE}/schedules/${encodeURIComponent(scheduleId)}`,
    { method: 'PATCH', body: payload }
  );

export const deleteSchedule = async (scheduleId: string): Promise<ApiResponse<ScheduleSummary>> =>
  apiClient<ApiResponse<ScheduleSummary>>(`${BASE}/schedules/${encodeURIComponent(scheduleId)}`, {
    method: 'DELETE',
  });

export const publishSchedule = async (scheduleId: string): Promise<ApiResponse<ScheduleDraft>> =>
  apiClient<ApiResponse<ScheduleDraft>>(
    `${BASE}/schedules/${encodeURIComponent(scheduleId)}/publish`,
    { method: 'POST' }
  );

export const getSchedulePdfUrl = (scheduleId: string, view?: 'teacher' | 'classGroup'): string =>
  `${process.env.NEXT_PUBLIC_BASE_URL}${BASE}/schedules/${encodeURIComponent(scheduleId)}/pdf${
    view === 'teacher' ? '?view=teacher' : ''
  }`;

/** Downloads the PDF with the auth token and opens it in a new tab. */
export const openSchedulePdf = async (
  scheduleId: string,
  view?: 'teacher' | 'classGroup'
): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(getSchedulePdfUrl(scheduleId, view), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error('Failed to export PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

// ─── Teacher widget ───────────────────────────────────────────────────────

export const getMySchedule = async (): Promise<ApiResponse<{ sessions: PublishedSession[] }>> =>
  apiClient<ApiResponse<{ sessions: PublishedSession[] }>>(`${BASE}/my-schedule`);
