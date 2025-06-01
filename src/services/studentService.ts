import apiClient from './apiClient';
import { StudentResponse, AllStudentsResponse, StudentPayload } from './types/student';

export const getAllStudents = async (
  school: string
): Promise<AllStudentsResponse> => {
  return apiClient<AllStudentsResponse>(`/students?school=${encodeURIComponent(school)}`);
};

/**
 * Fetch a single student by ID
 * @param id The student ID
 */
export const getStudentById = async (
  id: string
): Promise<StudentResponse> => {
  return apiClient<StudentResponse>(`/students/${id}`);
};

/**
 * Create a new student
 * @param studentData Partial student fields; only name and school are required
 */
export const createStudent = async (
  studentData: Omit<StudentPayload, 'studentId' | 'createdAt' | 'lastModifiedAt'>
): Promise<StudentResponse> => {
  return apiClient<StudentResponse>(`/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: studentData,
  });
};

/**
 * Update an existing student (partial)
 * @param id The student ID
 * @param updateData Fields to update
 */
export const updateStudent = async (
  id: string,
  updateData: Partial<Omit<StudentPayload, 'studentId' | 'createdAt' | 'lastModifiedAt'>>
): Promise<StudentResponse> => {
  return apiClient<StudentResponse>(`/students/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: updateData,
  });
};

/**
 * Delete a student by ID
 * @param id The student ID
 */
export const deleteStudent = async (
  id: string
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(`/students/${id}`, {
    method: 'DELETE',
  });
};
