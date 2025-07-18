// src/services/types/tuitionInvoiceComment.d.ts

/**
 * Represents a tuition invoice comment record
 */
export interface TuitionInvoiceCommentPayload {
  commentId: string;
  invoiceId: string;
  commenterId?: string;
  commenterName: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  // Additional fields for recent comments query
  studentName?: string;
  amountDue?: number;
}

/**
 * Response wrapper for list endpoints
 */
export interface TuitionInvoiceCommentListResponse {
  status: 'success' | 'failed';
  data: TuitionInvoiceCommentPayload[];
  message?: string;
}

/**
 * Response wrapper for single comment endpoints
 */
export interface TuitionInvoiceCommentResponse {
  status: 'success' | 'failed';
  data: TuitionInvoiceCommentPayload;
  message?: string;
}

/**
 * Request payload for creating tuition invoice comments
 */
export interface TuitionInvoiceCommentRequest {
  invoiceId: string;
  commenterId: string;
  commenterName: string;
  comment: string;
}

/**
 * Request payload for updating tuition invoice comments
 */
export interface UpdateTuitionInvoiceCommentRequest {
  comment: string;
  commenterId: string;
}

/**
 * Response wrapper for delete endpoints
 */
export interface DeleteTuitionInvoiceCommentResponse {
  status: 'success' | 'failed';
  message?: string;
}