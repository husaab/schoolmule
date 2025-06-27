import apiClient from './apiClient';

// Payload for public contact form
export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

// Response shape from the server
export interface ContactResponse {
  success: boolean;
  message: string;
}

/**
 * Send a message from the public Contact page
 * POST /api/email/contact
 */
export const sendContactForm = async (
  payload: ContactPayload
): Promise<ContactResponse> => {
  return apiClient<ContactResponse>('/email/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
};

// Payload for authenticated support ticket
export interface TicketPayload {
  username:     string;
  school:       string;
  issueType:    string;
  description:  string;
  contactEmail: string;
}

// Response shape from the server
export interface TicketResponse {
  success: boolean;
  message: string;
}

/**
 * Submit a support ticket for logged-in users
 * POST /api/email/ticket
 */
export const sendSupportTicket = async (
  payload: TicketPayload
): Promise<TicketResponse> => {
  return apiClient<TicketResponse>('/email/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
};
