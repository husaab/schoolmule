// File: src/services/calendarEventService.ts

import apiClient from './apiClient';
import type {
  CalendarEventsResponse,
  CalendarEventResponse,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest
} from './types/calendarEvent';

/**
 * GET /calendar-events?school=X&academicYear=2025-2026
 * Get all events for a school within an academic year (Aug 1 - Jul 31)
 */
export const getEventsByAcademicYear = async (
  school: string,
  academicYear: string
): Promise<CalendarEventsResponse> => {
  return apiClient<CalendarEventsResponse>(
    `/calendar-events?school=${encodeURIComponent(school)}&academicYear=${encodeURIComponent(academicYear)}`
  );
};

/**
 * GET /calendar-events?school=X&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Get all events for a school within a date range
 */
export const getEventsByRange = async (
  school: string,
  from: string,
  to: string
): Promise<CalendarEventsResponse> => {
  return apiClient<CalendarEventsResponse>(
    `/calendar-events?school=${encodeURIComponent(school)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
};

/**
 * POST /calendar-events
 * Create a new calendar event
 */
export const createCalendarEvent = async (
  payload: CreateCalendarEventRequest
): Promise<CalendarEventResponse> => {
  return apiClient<CalendarEventResponse, CreateCalendarEventRequest>('/calendar-events', {
    method: 'POST',
    body: payload
  });
};

/**
 * PATCH /calendar-events/:eventId
 * Update a calendar event
 */
export const updateCalendarEvent = async (
  eventId: string,
  payload: UpdateCalendarEventRequest
): Promise<CalendarEventResponse> => {
  return apiClient<CalendarEventResponse, UpdateCalendarEventRequest>(
    `/calendar-events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      body: payload
    }
  );
};

/**
 * DELETE /calendar-events/:eventId
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (
  eventId: string
): Promise<CalendarEventResponse> => {
  return apiClient<CalendarEventResponse>(
    `/calendar-events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE'
    }
  );
};
