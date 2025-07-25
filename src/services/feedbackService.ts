// src/services/feedbackService.ts

import apiClient from './apiClient';
import {
  SendFeedbackRequest,
  SendFeedbackResponse,
  UpdateFeedbackRequest,
  DeleteFeedbackResponse,
  FeedbackListResponse
} from './types/feedback';

/**
 * GET /feedback/sent?senderId=<uuid>
 */
export const getSentFeedback = async (
  senderId: string
): Promise<FeedbackListResponse> => {
  return apiClient<FeedbackListResponse>(
    `/feedback/sent?senderId=${encodeURIComponent(senderId)}`
  );
};

/**
 * GET /feedback/inbox?recipientId=<uuid>
 */
export const getInboxFeedback = async (
  recipientId: string
): Promise<FeedbackListResponse> => {
  return apiClient<FeedbackListResponse>(
    `/feedback/inbox?recipientId=${encodeURIComponent(recipientId)}`
  );
};

/**
 * GET /feedback/student/:studentId
 */
export const getFeedbackByStudentId = async (
  studentId: string
): Promise<FeedbackListResponse> => {
  return apiClient<FeedbackListResponse>(
    `/feedback/student/${encodeURIComponent(studentId)}`
  );
};

/**
 * POST /feedback
 */
export const sendFeedback = async (
  payload: SendFeedbackRequest
): Promise<SendFeedbackResponse> => {
  return apiClient<SendFeedbackResponse>('/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
};

/**
 * PATCH /feedback/:feedbackId
 */
export const updateFeedback = async (
  feedbackId: string,
  payload: UpdateFeedbackRequest
): Promise<SendFeedbackResponse> => {
  return apiClient<SendFeedbackResponse>(`/feedback/${feedbackId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
};

/**
 * DELETE /feedback/:feedbackId
 */
export const deleteFeedback = async (
  feedbackId: string,
  senderId: string
): Promise<DeleteFeedbackResponse> => {
  return apiClient<DeleteFeedbackResponse>(`/feedback/${feedbackId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: { senderId }
  });
};