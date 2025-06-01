// src/services/classService.ts

import apiClient from './apiClient';
import { ClassPayload, ClassResponse, AllClassesResponse } from './types/class';
import { AllAssessmentsResponse } from './types/assessment';
/**
 * Fetch all classes for a given school
 * @param school The school identifier
 * @returns A list of ClassPayload wrapped in a status/data envelope
 */
export const getAllClasses = async (
  school: string
): Promise<AllClassesResponse> => {
  return apiClient<AllClassesResponse>(
    `/classes?school=${encodeURIComponent(school)}`
  );
};

/**
 * Fetch a single class by its ID
 * @param id The class ID (UUID)
 */
export const getClassById = async (
  id: string
): Promise<ClassResponse> => {
  return apiClient<ClassResponse>(`/classes/${id}`);
};

/**
 * Fetch classes filtered by grade within a specific school
 * @param school The school identifier
 * @param grade  The grade number to filter
 */
export const getClassesByGrade = async (
  school: string,
  grade: number
): Promise<AllClassesResponse> => {
  return apiClient<AllClassesResponse>(
    `/classes/grade/${grade}?school=${encodeURIComponent(school)}`
  );
};

/**
 * Fetch classes for a given homeroom teacher name
 * @param teacherName The full name of the homeroom teacher
 */
export const getClassesByTeacher = async (
  teacherName: string
): Promise<AllClassesResponse> => {
  return apiClient<AllClassesResponse>(
    `/classes/teacher/${encodeURIComponent(teacherName)}`
  );
};

/**
 * Create a new class
 * @param classData
 *    An object containing all required fields: 
 *    - school
 *    - grade
 *    - subject
 *    - homeroomTeacherName
 */
export const createClass = async (
  classData: Omit<ClassPayload, 'classId' | 'createdAt' | 'lastModifiedAt'>
): Promise<ClassResponse> => {
    const body = {
        school:                classData.school,
        grade:                 classData.grade,
        subject:               classData.subject,
        homeroom_teacher_name: classData.homeroomTeacherName,
    }
  return apiClient<ClassResponse>(`/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body,
  });
};

/**
 * Update an existing class (partial update)
 * @param id The class ID to update
 * @param updateData One or more of:
 *   { school, grade, subject, homeroomTeacherName }
 */
export const updateClass = async (
  id: string,
  updateData: Partial<
    Omit<ClassPayload, 'classId' | 'createdAt' | 'lastModifiedAt'>
  >
): Promise<ClassResponse> => {
  return apiClient<ClassResponse>(`/classes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: updateData,
  });
};

/**
 * Delete a class by its ID
 * @param id The class ID to delete
 */
export const deleteClass = async (
  id: string
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(`/classes/${id}`, {
    method: 'DELETE',
  });
};

/**
 * GET /classes/:classId/assessments
 * → List all assessments for a class
 * @param classId The class UUID
 */
export const getAssessmentsByClass = async (
  classId: string
): Promise<AllAssessmentsResponse> => {
  return apiClient<AllAssessmentsResponse>(
    `/classes/${classId}/assessments`
  );
};