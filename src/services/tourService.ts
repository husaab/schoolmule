// src/services/tourService.ts
// Guided-tour progress. The server keeps what each person did with each tour
// (offered, where they paused, finished) and works it out from these events.
import apiClient from './apiClient'
import type { TourEventBody, TourEventResponse, TourProgressResponse } from './types/tour'

export const getTourProgress = (): Promise<TourProgressResponse> => apiClient<TourProgressResponse>('/tours/progress')

export const postTourEvent = (tourId: string, body: TourEventBody): Promise<TourEventResponse> =>
  apiClient<TourEventResponse>(`/tours/${encodeURIComponent(tourId)}/event`, { method: 'POST', body })
