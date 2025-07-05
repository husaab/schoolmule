// File: src/services/messageService.ts

import apiClient from "./apiClient";
import {
  MessageResponse,
  MessageListResponse
} from "./types/message";

/**
 * Fetch all messages sent by a specific user
 * GET /api/messages/sent?senderId=<uuid>
 */
export const getSentMessages = async (
  senderId: string
): Promise<MessageListResponse> => {
  const url = `/messages/sent?senderId=${encodeURIComponent(senderId)}`;
  return apiClient<MessageListResponse>(url);
};

/**
 * Fetch all messages received by a specific user
 * GET /api/messages/inbox?recipientId=<uuid>
 */
export const getInboxMessages = async (
  recipientId: string
): Promise<MessageListResponse> => {
  const url = `/messages/inbox?recipientId=${encodeURIComponent(recipientId)}`;
  return apiClient<MessageListResponse>(url);
};

/**
 * Payload for sending a new message
 */
export interface SendMessagePayload {
  senderId: string;
  recipientId: string;
  school: string;
  subject?: string;
  body: string;
  senderName: string;
  recipientName: string;
}

/**
 * Send a new message
 * POST /api/messages
 */
export const sendMessage = async (
  payload: SendMessagePayload
): Promise<MessageResponse> => {
  return apiClient<MessageResponse>(`/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
};

/**
 * Payload for updating an existing message
 */
export interface UpdateMessagePayload {
  senderId: string;
  subject?: string;
  body?: string;
}

/**
 * Update an existing message
 * PATCH /api/messages/:messageId
 */
export const updateMessage = async (
  messageId: string,
  payload: UpdateMessagePayload
): Promise<MessageResponse> => {
  return apiClient<MessageResponse>(
    `/messages/${encodeURIComponent(messageId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }
  );
};

/**
 * Payload for deleting a message
 */
export interface DeleteMessagePayload {
  senderId: string;
}

/**
 * Delete a message by its ID
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (
  messageId: string,
  payload: DeleteMessagePayload
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(
    `/messages/${encodeURIComponent(messageId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }
  );
};

export interface MassParentsPayload {
  senderId: string;
  school: string;
  subject?: string;
  body: string;
  senderName: string;
}

/**
 * Send a message to all parents of the school
 * POST /api/messages/mass/parents
 */
export const sendToAllParents = async (
  payload: MassParentsPayload
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(
    `/messages/mass/parents`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }
  );
};

export interface GradeParentsPayload extends MassParentsPayload {
  grade: number;
}

/**
 * Send a message to all parents of a specific grade
 * POST /api/messages/mass/parents/grade
 */
export const sendToParentsByGrade = async (
  payload: GradeParentsPayload
): Promise<{ status: string; message: string }> => {
  return apiClient<{ status: string; message: string }>(
    `/messages/mass/parents/grade`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }
  );
};