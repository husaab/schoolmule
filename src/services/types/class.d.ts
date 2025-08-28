// src/services/types/class.ts

import { GradeValue } from "@/lib/schoolUtils";

/**
 * Represents a single class record as returned by the API
 */
export interface ClassPayload {
  classId:      string;
  school:       string;
  grade:        GradeValue;
  subject:      string;
  teacherName:  string;
  teacherId:    string;
  termId:       string;
  termName:     string;
  createdAt:    string;
  lastModifiedAt: string;
}

/**
 * Response wrapper for single-class endpoints
 */
export interface ClassResponse {
  status: string;
  data: ClassPayload;
  message?: string;
}

/**
 * Response wrapper for list-of-classes endpoints
 */
export interface AllClassesResponse {
  status: string;
  data: ClassPayload[];
  message?: string;
}
