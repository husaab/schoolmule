// src/services/reportService.ts

// Get token function (avoid circular import)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

type Orientation = 'horizontal' | 'vertical';

/** POSTs to a PDF endpoint; a refusal throws the server's own message when it sent one. */
const postForPdf = async (path: string, fallbackError: string): Promise<Blob> => {
  const token = getToken();
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.message === 'string' ? body.message : `${fallbackError}: ${response.status}`);
  }

  return response.blob();
};

/**
 * Generate student summary report PDF
 * POST /api/reports/student-summary/:studentId/:classId
 * @param orientation - 'horizontal' (landscape, default) or 'vertical' (portrait)
 */
export const generateStudentSummaryReport = (
  studentId: string,
  classId: string,
  orientation: Orientation = 'horizontal'
): Promise<Blob> =>
  postForPdf(
    `/reports/student-summary/${encodeURIComponent(studentId)}/${encodeURIComponent(classId)}?orientation=${orientation}`,
    'Failed to generate student summary report',
  );

/**
 * One student's summary for every class they're in that term, as one PDF:
 * a page of term grades, then each class's page.
 * POST /api/reports/student-summary/:studentId?termId=&orientation=
 */
export const generateStudentTermSummaryReport = (
  studentId: string,
  termId: string,
  orientation: Orientation = 'horizontal'
): Promise<Blob> =>
  postForPdf(
    `/reports/student-summary/${encodeURIComponent(studentId)}?termId=${encodeURIComponent(termId)}&orientation=${orientation}`,
    'Failed to generate student summary report',
  );
