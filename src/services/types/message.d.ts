// File: src/services/types/message.ts

/**
 * Represents a single message record as returned by the API
 */
export interface MessagePayload {
  message_id: string;
  sender_id: string;
  recipient_id: string;
  school: string;
  subject?: string;
  body: string;
  created_at: string;
  sender_name?: string;            // full name of sender
  recipient_name?: string;         // full name of recipient
  last_modified_at?: string;       // timestamp of last edit
}

/**
 * Response wrapper for a single-message endpoint
 */
export interface MessageResponse {
  status: "success" | "failed";
  data: MessagePayload;
  message?: string;
}

/**
 * Response wrapper for list-of-messages endpoints
 */
export interface MessageListResponse {
  status: "success" | "failed";
  data: MessagePayload[];
  message?: string;
}
