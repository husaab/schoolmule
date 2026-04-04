import type { PublicFormResponse, PublicSubmitResponse } from './types/registration';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Fetch a published form for public rendering (no auth required)
 */
export const getPublicForm = async (
  schoolSlug: string,
  formSlug: string
): Promise<PublicFormResponse> => {
  const response = await fetch(
    `${baseURL}/registration/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(formSlug)}`
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Form not found' }));
    throw new Error(errorBody.message || 'Form not found');
  }

  return response.json();
};

/**
 * Submit a public form (no auth required)
 */
export const submitPublicForm = async (
  schoolSlug: string,
  formSlug: string,
  answers: Record<string, string>,
  honeypotFields: { website?: string; url?: string; homepage?: string } = {}
): Promise<PublicSubmitResponse> => {
  const response = await fetch(
    `${baseURL}/registration/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(formSlug)}/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, ...honeypotFields }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Submission failed' }));
    throw new Error(errorBody.message || 'Submission failed');
  }

  return response.json();
};
