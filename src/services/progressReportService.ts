import apiClient from "./apiClient"

export interface ProgressReportFeedback {
  id?: string
  studentId: string
  classId: string
  coreStandards?: string
  workHabit?: string
  behavior?: string
  comment?: string
  createdAt?: string
}

export interface UpsertProgressReportFeedbackPayload {
  studentId: string
  classId: string
  coreStandards?: string
  workHabit?: string
  behavior?: string
  comment?: string
}

export interface ProgressReportFeedbackResponse {
  status: string
  data: ProgressReportFeedback | null
  message?: string
}

export interface AllProgressReportFeedbackResponse {
  status: string
  data: ProgressReportFeedback[]
  message?: string
}

export interface ProgressReportRecord {
  studentId: string
  term: string
  studentName?: string
  grade?: string
  filePath?: string
  school?: string
  generatedAt?: string
  emailSent?: boolean
  emailSentAt?: string
  emailSentBy?: string
}

export interface ProgressReportRecordResponse {
  status: string
  data: ProgressReportRecord
  message?: string
}

export interface AllProgressReportRecordsResponse {
  status: string
  data: ProgressReportRecord[]
  message?: string
}

// Get progress report feedback for a specific student and class
export const getProgressReportFeedback = async (
  studentId: string, 
  classId: string
): Promise<ProgressReportFeedbackResponse> => {
  return apiClient<ProgressReportFeedbackResponse>(
    `/progress-reports/feedback/student/${encodeURIComponent(studentId)}/class/${encodeURIComponent(classId)}`
  )
}

// Create or update progress report feedback
export const upsertProgressReportFeedback = async (
  payload: UpsertProgressReportFeedbackPayload
): Promise<ProgressReportFeedbackResponse> => {
  return apiClient<ProgressReportFeedbackResponse>(
    `/progress-reports/feedback/student/${encodeURIComponent(payload.studentId)}/class/${encodeURIComponent(payload.classId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        coreStandards: payload.coreStandards,
        workHabit: payload.workHabit,
        behavior: payload.behavior,
        comment: payload.comment
      }
    }
  )
}

// Get all progress report feedback for a student across all classes
export const getStudentProgressReportFeedback = async (
  studentId: string
): Promise<AllProgressReportFeedbackResponse> => {
  return apiClient<AllProgressReportFeedbackResponse>(
    `/progress-reports/feedback/student/${encodeURIComponent(studentId)}`
  )
}

// Get all progress report feedback for a class
export const getClassProgressReportFeedback = async (
  classId: string
): Promise<AllProgressReportFeedbackResponse> => {
  return apiClient<AllProgressReportFeedbackResponse>(
    `/progress-reports/feedback/class/${encodeURIComponent(classId)}`
  )
}

// Delete progress report feedback
export const deleteProgressReportFeedback = async (
  studentId: string, 
  classId: string
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(
    `/progress-reports/feedback/student/${encodeURIComponent(studentId)}/class/${encodeURIComponent(classId)}`,
    {
      method: 'DELETE'
    }
  )
}

// Create progress report record
export const createProgressReport = async (payload: {
  studentId: string
  term: string
  studentName?: string
  grade?: string
  filePath?: string
  school?: string
}): Promise<ProgressReportRecordResponse> => {
  return apiClient<ProgressReportRecordResponse>('/progress-reports/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
}

// Get progress reports for a student
export const getStudentProgressReports = async (
  studentId: string
): Promise<AllProgressReportRecordsResponse> => {
  return apiClient<AllProgressReportRecordsResponse>(
    `/progress-reports/reports/student/${encodeURIComponent(studentId)}`
  )
}

// Get progress reports by term and school
export const getProgressReportsByTermAndSchool = async (
  term: string, 
  school: string
): Promise<AllProgressReportRecordsResponse> => {
  return apiClient<AllProgressReportRecordsResponse>(
    `/progress-reports/reports/term/${encodeURIComponent(term)}/school/${encodeURIComponent(school)}`
  )
}

// Generate single progress report
export const generateProgressReport = async (payload: {
  studentId: string
  term: string
}): Promise<{ status: string; message: string; data: unknown }> => {
  return apiClient<{ status: string; message: string; data: unknown }>('/progress-reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
}

// Generate multiple progress reports in bulk
export const generateBulkProgressReports = async (payload: {
  studentIds: string[]
  term: string
}): Promise<{ status: string; term: string; generated: unknown[]; failed: unknown[] }> => {
  return apiClient<{ status: string; term: string; generated: unknown[]; failed: unknown[] }>('/progress-reports/generate/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
}

// Delete progress report
export const deleteProgressReport = async (filePath: string): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(`/progress-reports/delete?filePath=${encodeURIComponent(filePath)}`, {
    method: 'DELETE'
  })
}

// Get signed URL for progress report (similar to report cards)
export const getSignedProgressReportUrl = async (filePath: string): Promise<string | null> => {
  const response = await apiClient<{ url: string }>(`/progress-reports/signed-url?path=${encodeURIComponent(filePath)}`);
  return response.url || null;
};
