import apiClient from "./apiClient";
import { ScheduleEntry } from "./types/schedule";

/**
 * Fetch all schedule entries for a given school and week
 * @param school The school enum value (e.g. "AL_HAADI")
 * @param weekStartDate The ISO string for the week's Monday (e.g. "2025-06-17")
 * @returns A list of ScheduleEntry items
 */
export const getSchedulesForWeek = async (
  school: string,
  weekStartDate: string
): Promise<{ status: string; data: ScheduleEntry[] }> => {
  return apiClient<{ status: string; data: ScheduleEntry[] }>(
    `/schedules?school=${encodeURIComponent(school)}&week=${weekStartDate}`
  );
};

/**
 * Create a new schedule entry
 * @param scheduleData The new schedule entry details (excluding auto-generated fields)
 */
export const createSchedule = async (
  scheduleData: Omit<ScheduleEntry, 'schedule_id' | 'created_at' | 'updated_at'>
): Promise<{ status: string; data: ScheduleEntry }> => {
  return apiClient<{ status: string; data: ScheduleEntry }>(`/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: scheduleData,
  });
};

/**
 * Delete a schedule by its ID
 * @param id The schedule ID to delete
 */
export const deleteSchedule = async (
  id: string
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(`/schedules/${id}`, {
    method: "DELETE",
  });
};

/**
 * Update an existing schedule entry
 * @param id The schedule_id to update
 * @param data Partial fields matching snake_case backend
 */
export const updateSchedule = async (
  id: string,
  data: {
    school: string
    grade: number
    subject: string
    teacher_name: string
    teacher_id?: string
    day_of_week: string
    start_time: string
    end_time: string
    week_start_date: string
    is_lunch: boolean
    lunch_supervisor?: string
  }
): Promise<{ status: string; data: ScheduleEntry }> => {
  return apiClient<{ status: string; data: ScheduleEntry }>(
    `/schedules/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data
    }
  )
}