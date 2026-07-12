// src/services/types/calendarEvent.d.ts

export type CalendarEventCategory = 'event' | 'holiday' | 'pa-day' | 'exam' | 'other';

/**
 * School calendar event payload (from API response)
 */
export interface CalendarEventPayload {
  eventId: string;
  school: string;              // School enum value
  schoolId?: string;           // UUID reference
  title: string;
  category: CalendarEventCategory;
  startDate: string;           // ISO date string (YYYY-MM-DD)
  endDate?: string | null;     // Optional range end (YYYY-MM-DD)
  isSchoolClosed: boolean;     // Shades the day on agenda weekly pages
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Event creation request payload
 */
export interface CreateCalendarEventRequest {
  school: string;
  title: string;
  category?: CalendarEventCategory;
  startDate: string;
  endDate?: string | null;
  isSchoolClosed?: boolean;
  notes?: string | null;
}

/**
 * Event update request payload
 */
export interface UpdateCalendarEventRequest {
  title?: string;
  category?: CalendarEventCategory;
  startDate?: string;
  endDate?: string | null;
  isSchoolClosed?: boolean;
  notes?: string | null;
}

/**
 * API response for multiple events
 */
export interface CalendarEventsResponse {
  status: string;
  data: CalendarEventPayload[];
}

/**
 * API response for a single event
 */
export interface CalendarEventResponse {
  status: string;
  data: CalendarEventPayload;
}
