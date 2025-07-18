// src/services/types/tuitionInvoice.d.ts

/**
 * Represents a tuition invoice record
 */
export interface TuitionInvoicePayload {
  invoiceId: string;
  planId: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentNumber?: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  dateDue: string;
  amountPaid?: number;
  datePaid?: string;
  issuedAt?: string;
  status: string;
  createdAt: string;
  lastModifiedAt?: string;
  school: string;
}

/**
 * Response wrapper for list endpoints
 */
export interface TuitionInvoiceListResponse {
  status: 'success' | 'failed';
  data: TuitionInvoicePayload[];
  message?: string;
}

/**
 * Response wrapper for single invoice endpoints
 */
export interface TuitionInvoiceResponse {
  status: 'success' | 'failed';
  data: TuitionInvoicePayload;
  message?: string;
}

/**
 * Request payload for creating tuition invoices
 */
export interface TuitionInvoiceRequest {
  planId: string;
  studentId: string;
  studentName: string;
  studentGrade?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentNumber?: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  dateDue: string;
  amountPaid?: number;
  datePaid?: string;
  issuedAt?: string;
  status?: string;
  school: string;
}

/**
 * Request payload for generating bulk invoices
 */
export interface GenerateInvoicesRequest {
  school: string;
  grade?: string;
  billingMonth: string;
  dueDate: string;
}

/**
 * Response from bulk invoice generation
 */
export interface GenerateInvoicesResponse {
  status: 'success' | 'failed';
  data: {
    invoicesCreated: number;
    invoicesSkipped: number;
    totalStudents: number;
    errors?: string[];
  };
  message?: string;
}

/**
 * Response wrapper for delete endpoints
 */
export interface DeleteTuitionInvoiceResponse {
  status: 'success' | 'failed';
  message?: string;
}