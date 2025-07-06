
// src/services/types/feedback.ts

/**
 * Represents a feedback record
 */
export interface FeedbackPayload {
  feedbackId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  school: string;
  subject?: string;
  body: string;
  assessmentName: string;
  score: number;
  weightPercentage: number;
  createdAt: string;
  lastModifiedAt: string;
  studentId: string;
}

/**
 * Response wrapper for list endpoints
 */
export interface FeedbackListResponse {
  status: 'success' | 'failed';
  data: FeedbackPayload[];
  message?: string;
}

/**
 * Request payload for creating feedback
 */
export interface SendFeedbackRequest {
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  school: string;
  subject?: string;
  body: string;
  assessmentName: string;
  score: number;
  weightPercentage: number;
  childName: string;
  courseName: string;
  studentId: string;
}

/**
 * Response wrapper for send/update endpoints
 */
export interface SendFeedbackResponse {
  status: 'success' | 'failed';
  data: FeedbackPayload;
  message?: string;
}

/**
 * Partial request for updating feedback
 */
export interface UpdateFeedbackRequest {
  senderId: string;
  subject?: string;
  body?: string;
  assessmentName?: string;
  score?: number;
  weightPercentage?: number;
}

/**
 * Response wrapper for delete
 */
export interface DeleteFeedbackResponse {
  status: 'success' | 'failed';
  message?: string;
}
