// src/services/classService.ts

import apiClient from "./apiClient";
import {
  ClassPayload,
  ClassResponse,
  AllClassesResponse,
} from "./types/class";
import { AllAssessmentsResponse } from "./types/assessment";
import {
  AllStudentsResponse,
  EnrollStudentPayload,
  EnrollStudentResponse,
  UnenrollStudentResponse,
} from "./types/student";

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
export const getClassById = async (id: string): Promise<ClassResponse> => {
  return apiClient<ClassResponse>(`/classes/${id}`);
};

/**
 * Fetch classes filtered by grade within a specific school
 * @param school The school identifier
 * @param grade The grade number to filter
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
 * Fetch classes for a given teacher name
 * @param teacherName The full name of the teacher
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
 *    - teacherName
 *    - teacherId
 */
export const createClass = async (
  classData: Omit<
    ClassPayload,
    "classId" | "createdAt" | "lastModifiedAt"
  >
): Promise<ClassResponse> => {
  const body = {
    school:      classData.school,
    grade:       classData.grade,
    subject:     classData.subject,
    teacherName: classData.teacherName,  // ✅ matches req.body.teacherName
    teacherId:   classData.teacherId,    // ✅ matches req.body.teacherId
  };
  return apiClient<ClassResponse>(`/classes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
};

/**
 * Fetch classes for a given teacher ID (UUID)
 */
export const getClassesByTeacherId = async (
  teacherId: string
): Promise<AllClassesResponse> => {
  return apiClient<AllClassesResponse>(
    `/classes/teacher/id/${encodeURIComponent(teacherId)}`
  )
}

/**
 * Update an existing class (partial update)
 * @param id The class ID to update
 * @param updateData One or more of:
 *   { school, grade, subject, teacherName, teacherId }
 */
export const updateClass = async (
  id: string,
  updateData: Partial<
    Omit<ClassPayload, "classId" | "createdAt" | "lastModifiedAt">
  >
): Promise<ClassResponse> => {
  // Convert our camelCase -> snake_case as expected by backend
  const body: any = {};
  if (updateData.school !== undefined)     body.school = updateData.school;
  if (updateData.grade !== undefined)      body.grade = updateData.grade;
  if (updateData.subject !== undefined)    body.subject = updateData.subject;
  if (updateData.teacherName !== undefined) body.teacherName = updateData.teacherName;
  if (updateData.teacherId   !== undefined) body.teacherId   = updateData.teacherId;

  return apiClient<ClassResponse>(`/classes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
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
    method: "DELETE",
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

/**
 * GET /classes/:classId/students
 * → List all students in a given class
 * @param classId The class UUID
 */
export const getStudentsInClass = async (
  classId: string
): Promise<AllStudentsResponse> => {
  return apiClient<AllStudentsResponse>(`/classes/${classId}/students`);
};

/**
 * POST /classes/:classId/students
 * → Enroll a student in a class
 * @param classId   The class UUID
 * @param payload   { studentId: string }
 */
export const enrollStudentInClass = async (
  classId: string,
  payload: EnrollStudentPayload
): Promise<EnrollStudentResponse> => {
  return apiClient<EnrollStudentResponse>(`/classes/${classId}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
};

/**
 * DELETE /classes/:classId/students/:studentId
 * → Unenroll (remove) a student from a class
 * @param classId   The class UUID
 * @param studentId The student UUID
 */
export const unenrollStudentFromClass = async (
  classId: string,
  studentId: string
): Promise<UnenrollStudentResponse> => {
  return apiClient<UnenrollStudentResponse>(
    `/classes/${classId}/students/${studentId}`,
    {
      method: "DELETE",
    }
  );
};

/**
 * POST /classes/:classId/students/bulk
 * → Bulk-enroll students
 */
export const bulkEnrollStudentsToClass = async (
  classId: string,
  payload: BulkEnrollPayload
): Promise<BulkEnrollResponse> => {
  return apiClient<BulkEnrollResponse>(
    `/classes/${classId}/students/bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }
  );
};

export interface BulkEnrollPayload {
  /** If true, the backend will ignore studentIds and enroll every student in this class’s grade */
  enrollAllInGrade: boolean;
  /** Optional list of specific student UUIDs to enroll (ignored if enrollAllInGrade=true) */
  studentIds?: string[];
}

export interface BulkEnrollResponse {
  status: "success" | "failed";
  /** An array of objects showing which (classId, studentId) pairs were actually inserted */
  data: Array<{ classId: string; studentId: string }>;
  /** If something went wrong, the backend may include a message here */
  message?: string;
}

/**
 * POST /classes/:classId/students/bulk-unenroll
 * → Bulk-unenroll all students from a class
 */
export const bulkUnenrollStudentsFromClass = async (classId: string) => {
  return apiClient(
    `/classes/${classId}/students/bulk-unenroll`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const getScoresByClass = async (
  classId: string
): Promise<{ status: string; data: Array<{
    student_id: string;
    student_name: string;
    assessment_id: string;
    assessment_name: string;
    weight_percent: number;
    score: number | null;
  }>; message?: string }> => {
  return apiClient(`/studentAssessments/classes/${encodeURIComponent(classId)}/scores`);
};

export const upsertScoresByClass = async (
  classId: string,
  scores: Array<{ studentId: string; assessmentId: string; score: number }>
) => {
  return apiClient(`/studentAssessments/classes/${encodeURIComponent(classId)}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { scores },
  });
};

/**
 * NEW: Download the Excel (XLSX) file for this class’s gradebook.
 *
 * Returns a Promise<Blob>, which the caller can turn into a downloadable URL.
 */
export const downloadGradebookExcel = async (
  classId: string
): Promise<Blob> => {
  // We assume NEXT_PUBLIC_BASE_URL is set to your API origin
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const url = `${baseURL}/studentAssessments/classes/${encodeURIComponent(classId)}/scores/csv`;

  const response = await fetch(url, {
    method: "GET",
    // You do NOT need `headers: { "Content-Type": ... }` for a GET
  });

  if (!response.ok) {
    throw new Error(`Failed to generate Excel file. Status: ${response.status}`);
  }

  return response.blob();
};