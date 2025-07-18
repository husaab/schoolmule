// src/services/tuitionInvoiceCommentService.ts

import apiClient from './apiClient';
import {
  TuitionInvoiceCommentListResponse,
  TuitionInvoiceCommentResponse,
  TuitionInvoiceCommentRequest,
  UpdateTuitionInvoiceCommentRequest,
  DeleteTuitionInvoiceCommentResponse
} from './types/tuitionInvoiceComment';

/**
 * Fetch all comments for a specific tuition invoice
 * GET /api/tuition-invoice-comments/invoice/:invoiceId
 */
export const getTuitionInvoiceCommentsByInvoiceId = async (invoiceId: string): Promise<TuitionInvoiceCommentListResponse> => {
  const url = `/tuition-invoice-comments/invoice/${encodeURIComponent(invoiceId)}`;
  return apiClient<TuitionInvoiceCommentListResponse>(url);
};

/**
 * Fetch a specific tuition invoice comment by ID
 * GET /api/tuition-invoice-comments/:commentId
 */
export const getTuitionInvoiceCommentById = async (commentId: string): Promise<TuitionInvoiceCommentResponse> => {
  const url = `/tuition-invoice-comments/${encodeURIComponent(commentId)}`;
  return apiClient<TuitionInvoiceCommentResponse>(url);
};

/**
 * Fetch comments by commenter ID
 * GET /api/tuition-invoice-comments/commenter/:commenterId
 */
export const getTuitionInvoiceCommentsByCommenterId = async (commenterId: string): Promise<TuitionInvoiceCommentListResponse> => {
  const url = `/tuition-invoice-comments/commenter/${encodeURIComponent(commenterId)}`;
  return apiClient<TuitionInvoiceCommentListResponse>(url);
};

/**
 * Fetch comments by school
 * GET /api/tuition-invoice-comments/school?school=<school>
 */
export const getTuitionInvoiceCommentsBySchool = async (school: string): Promise<TuitionInvoiceCommentListResponse> => {
  const url = `/tuition-invoice-comments/school?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionInvoiceCommentListResponse>(url);
};

/**
 * Fetch recent comments by school
 * GET /api/tuition-invoice-comments/recent?school=<school>&limit=<limit>
 */
export const getRecentTuitionInvoiceCommentsBySchool = async (school: string, limit: number = 10): Promise<TuitionInvoiceCommentListResponse> => {
  const url = `/tuition-invoice-comments/recent?school=${encodeURIComponent(school)}&limit=${limit}`;
  return apiClient<TuitionInvoiceCommentListResponse>(url);
};

/**
 * Create a new tuition invoice comment
 * POST /api/tuition-invoice-comments
 */
export const createTuitionInvoiceComment = async (payload: TuitionInvoiceCommentRequest): Promise<TuitionInvoiceCommentResponse> => {
  const url = '/tuition-invoice-comments';
  return apiClient<TuitionInvoiceCommentResponse>(url, {
    method: 'POST',
    body: payload
  });
};

/**
 * Update an existing tuition invoice comment
 * PATCH /api/tuition-invoice-comments/:commentId
 */
export const updateTuitionInvoiceComment = async (
  commentId: string,
  payload: UpdateTuitionInvoiceCommentRequest
): Promise<TuitionInvoiceCommentResponse> => {
  const url = `/tuition-invoice-comments/${encodeURIComponent(commentId)}`;
  return apiClient<TuitionInvoiceCommentResponse>(url, {
    method: 'PATCH',
    body: payload
  });
};

/**
 * Delete a tuition invoice comment
 * DELETE /api/tuition-invoice-comments/:commentId (requires commenterId in body)
 */
export const deleteTuitionInvoiceComment = async (commentId: string, commenterId: string): Promise<DeleteTuitionInvoiceCommentResponse> => {
  const url = `/tuition-invoice-comments/${encodeURIComponent(commentId)}`;
  return apiClient<DeleteTuitionInvoiceCommentResponse>(url, {
    method: 'DELETE',
    body: { commenterId }
  });
};