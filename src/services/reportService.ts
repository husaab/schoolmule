// src/services/reportService.ts

// Get token function (avoid circular import)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * Generate student summary report PDF
 * POST /api/reports/student-summary/:studentId/:classId
 */
export const generateStudentSummaryReport = async (
  studentId: string,
  classId: string
): Promise<Blob> => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const url = `${baseURL}/reports/student-summary/${encodeURIComponent(studentId)}/${encodeURIComponent(classId)}`;
  const token = getToken();
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate student summary report: ${response.status}`);
  }
  
  return response.blob();
};