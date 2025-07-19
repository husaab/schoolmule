// src/services/termService.ts

import apiClient from './apiClient';
import {
  TermPayload,
  CreateTermRequest,
  UpdateTermRequest,
  TermResponse,
  TermsResponse,
  TermDeleteResponse,
  TermActivateResponse
} from './types/term';

/**
 * Get all terms for a school
 * GET /api/terms?school=SCHOOL_ENUM
 */
export const getTermsBySchool = async (school: string): Promise<TermsResponse> => {
  const query = `?school=${encodeURIComponent(school)}`;
  return apiClient<TermsResponse>(`/terms${query}`);
};

/**
 * Get all terms for a school by school ID
 * GET /api/terms/school-id/:schoolId
 */
export const getTermsBySchoolId = async (schoolId: string): Promise<TermsResponse> => {
  return apiClient<TermsResponse>(`/terms/school-id/${encodeURIComponent(schoolId)}`);
};

/**
 * Get active term for a school
 * GET /api/terms/active?school=SCHOOL_ENUM
 */
export const getActiveTermBySchool = async (school: string): Promise<TermResponse> => {
  const query = `?school=${encodeURIComponent(school)}`;
  return apiClient<TermResponse>(`/terms/active${query}`);
};

/**
 * Get current term by date for a school
 * GET /api/terms/current?school=SCHOOL_ENUM&date=YYYY-MM-DD
 */
export const getCurrentTermBySchool = async (
  school: string,
  date?: string
): Promise<TermResponse> => {
  let query = `?school=${encodeURIComponent(school)}`;
  if (date) {
    query += `&date=${encodeURIComponent(date)}`;
  }
  return apiClient<TermResponse>(`/terms/current${query}`);
};

/**
 * Get terms for a specific academic year
 * GET /api/terms/academic-year?school=SCHOOL_ENUM&year=2024-2025
 */
export const getTermsByAcademicYear = async (
  school: string,
  academicYear: string
): Promise<TermsResponse> => {
  const query = `?school=${encodeURIComponent(school)}&year=${encodeURIComponent(academicYear)}`;
  return apiClient<TermsResponse>(`/terms/academic-year${query}`);
};

/**
 * Get term by ID
 * GET /api/terms/:id
 */
export const getTermById = async (id: string): Promise<TermResponse> => {
  return apiClient<TermResponse>(`/terms/${encodeURIComponent(id)}`);
};

/**
 * Create new term
 * POST /api/terms
 */
export const createTerm = async (termData: CreateTermRequest): Promise<TermResponse> => {
  return apiClient<TermResponse>('/terms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: termData,
  });
};

/**
 * Update term
 * PUT /api/terms/:id
 */
export const updateTerm = async (
  id: string,
  termData: UpdateTermRequest
): Promise<TermResponse> => {
  return apiClient<TermResponse>(`/terms/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: termData,
  });
};

/**
 * Set term as active (deactivates all other terms for the same school)
 * PUT /api/terms/:id/activate
 */
export const activateTerm = async (id: string): Promise<TermActivateResponse> => {
  return apiClient<TermActivateResponse>(`/terms/${encodeURIComponent(id)}/activate`, {
    method: 'PUT',
  });
};

/**
 * Update term status (active/inactive)
 * PUT /api/terms/:id/status
 */
export const updateTermStatus = async (
  id: string,
  isActive: boolean
): Promise<TermResponse> => {
  return apiClient<TermResponse>(`/terms/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: { isActive },
  });
};

/**
 * Delete term
 * DELETE /api/terms/:id
 */
export const deleteTerm = async (id: string): Promise<TermDeleteResponse> => {
  return apiClient<TermDeleteResponse>(`/terms/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

/**
 * Helper function to check if a term is current based on dates
 */
export const isTermCurrent = (term: TermPayload, date?: string): boolean => {
  const checkDate = date ? new Date(date) : new Date();
  const startDate = new Date(term.startDate);
  const endDate = new Date(term.endDate);
  
  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Helper function to format term date range for display
 */
export const formatTermDateRange = (term: TermPayload): string => {
  const startDate = new Date(term.startDate);
  const endDate = new Date(term.endDate);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
};

/**
 * Helper function to generate academic year string from dates
 */
export const generateAcademicYear = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return `${start.getFullYear()}-${end.getFullYear()}`;
};

/**
 * Helper function to validate term dates
 */
export const validateTermDates = (startDate: string, endDate: string): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return 'Start date must be before end date';
  }
  
  if (start < new Date('2020-01-01')) {
    return 'Start date cannot be before 2020';
  }
  
  if (end > new Date('2030-12-31')) {
    return 'End date cannot be after 2030';
  }
  
  return null;
};