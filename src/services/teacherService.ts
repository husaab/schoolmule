// src/services/teacherService.ts

import apiClient from "./apiClient";
import { AllTeachersResponse, TeacherPayload } from "./types/teacher"

/**
 * Fetch all teachers for a given school
 * @param school The school identifier
 * @returns A list of TeacherPayload wrapped in a status/data envelope
 */
export const getTeachersBySchool = async (
  school: string
): Promise<AllTeachersResponse> => {
  return apiClient<AllTeachersResponse>(
    `/teachers?school=${encodeURIComponent(school)}`
  );
};

export const getTeacherById = async (
  id: string
): Promise<{ status: string; data: TeacherPayload }> => {
  return apiClient<{ status: string; data: TeacherPayload }>(`/teachers/${id}`);
};