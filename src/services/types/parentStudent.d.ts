import { GradeValue } from "@/lib/schoolUtils";

export interface ParentStudentPayload {
  parentStudentLinkId: string;
  studentId: string;
  parentId?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  parentNumber?: string | null;
  relation: string;
  school: string;
  createdAt: string;
  student?: {
    name: string;
    grade: GradeValue;
  };
  parentUser?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface CreateParentStudentRequest {
  studentId: string;
  parentId?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  parentNumber?: string | null;
  relation: string;
  school: string;
}

export interface UpdateParentStudentRequest {
  parentId?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  parentNumber?: string | null;
  relation: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
}

export type ParentStudentListResponse = ApiResponse<ParentStudentPayload[]>;
export type ParentStudentResponse = ApiResponse<ParentStudentPayload>;
export type ParentStudentDeleteResponse = ApiResponse<{ message: string }>;