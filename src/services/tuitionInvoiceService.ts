// src/services/tuitionInvoiceService.ts

import apiClient from './apiClient';
import {
  TuitionInvoiceListResponse,
  TuitionInvoiceResponse,
  TuitionInvoiceRequest,
  GenerateInvoicesRequest,
  GenerateInvoicesResponse,
  DeleteTuitionInvoiceResponse
} from './types/tuitionInvoice';

/**
 * Fetch all tuition invoices for a specific school
 * GET /api/tuition-invoices?school=<school>
 */
export const getTuitionInvoicesBySchool = async (school: string): Promise<TuitionInvoiceListResponse> => {
  const url = `/tuition-invoices?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionInvoiceListResponse>(url);
};

/**
 * Fetch overdue tuition invoices for a specific school
 * GET /api/tuition-invoices/overdue?school=<school>
 */
export const getOverdueTuitionInvoicesBySchool = async (school: string): Promise<TuitionInvoiceListResponse> => {
  const url = `/tuition-invoices/overdue?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionInvoiceListResponse>(url);
};

/**
 * Fetch tuition invoices by status and school
 * GET /api/tuition-invoices/status/:status?school=<school>
 */
export const getTuitionInvoicesByStatusAndSchool = async (
  school: string,
  status: string
): Promise<TuitionInvoiceListResponse> => {
  const url = `/tuition-invoices/status/${encodeURIComponent(status)}?school=${encodeURIComponent(school)}`;
  return apiClient<TuitionInvoiceListResponse>(url);
};

/**
 * Fetch tuition invoices by student ID
 * GET /api/tuition-invoices/student/:studentId
 */
export const getTuitionInvoicesByStudentId = async (studentId: string): Promise<TuitionInvoiceListResponse> => {
  const url = `/tuition-invoices/student/${encodeURIComponent(studentId)}`;
  return apiClient<TuitionInvoiceListResponse>(url);
};

/**
 * Fetch tuition invoices by parent ID
 * GET /api/tuition-invoices/parent/:parentId
 */
export const getTuitionInvoicesByParentId = async (parentId: string): Promise<TuitionInvoiceListResponse> => {
  const url = `/tuition-invoices/parent/${encodeURIComponent(parentId)}`;
  return apiClient<TuitionInvoiceListResponse>(url);
};

/**
 * Fetch a specific tuition invoice by ID
 * GET /api/tuition-invoices/:invoiceId
 */
export const getTuitionInvoiceById = async (invoiceId: string): Promise<TuitionInvoiceResponse> => {
  const url = `/tuition-invoices/${encodeURIComponent(invoiceId)}`;
  return apiClient<TuitionInvoiceResponse>(url);
};

/**
 * Create a new tuition invoice
 * POST /api/tuition-invoices
 */
export const createTuitionInvoice = async (payload: TuitionInvoiceRequest): Promise<TuitionInvoiceResponse> => {
  const url = '/tuition-invoices';
  return apiClient<TuitionInvoiceResponse>(url, {
    method: 'POST',
    body: payload
  });
};

/**
 * Generate bulk tuition invoices
 * POST /api/tuition-invoices/generate
 */
export const generateTuitionInvoices = async (payload: GenerateInvoicesRequest): Promise<GenerateInvoicesResponse> => {
  const url = '/tuition-invoices/generate';
  return apiClient<GenerateInvoicesResponse>(url, {
    method: 'POST',
    body: payload
  });
};

/**
 * Update an existing tuition invoice
 * PATCH /api/tuition-invoices/:invoiceId
 */
export const updateTuitionInvoice = async (
  invoiceId: string,
  payload: Partial<TuitionInvoiceRequest>
): Promise<TuitionInvoiceResponse> => {
  const url = `/tuition-invoices/${encodeURIComponent(invoiceId)}`;
  return apiClient<TuitionInvoiceResponse>(url, {
    method: 'PATCH',
    body: payload
  });
};

/**
 * Update invoice payment information
 * PATCH /api/tuition-invoices/:invoiceId/payment
 */
export const updateTuitionInvoicePayment = async (
  invoiceId: string,
  amountPaid: number,
  datePaid: string,
  status: string
): Promise<TuitionInvoiceResponse> => {
  const url = `/tuition-invoices/${encodeURIComponent(invoiceId)}/payment`;
  return apiClient<TuitionInvoiceResponse>(url, {
    method: 'PATCH',
    body: { amountPaid, datePaid, status }
  });
};

/**
 * Delete a tuition invoice
 * DELETE /api/tuition-invoices/:invoiceId
 */
export const deleteTuitionInvoice = async (invoiceId: string): Promise<DeleteTuitionInvoiceResponse> => {
  const url = `/tuition-invoices/${encodeURIComponent(invoiceId)}`;
  return apiClient<DeleteTuitionInvoiceResponse>(url, {
    method: 'DELETE'
  });
};