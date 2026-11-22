// src/services/types/tour.d.ts
import type { TourEvent, TourPlatform, TourProgress } from '@/lib/tours/types'

export interface TourProgressResponse {
  status: string
  data: {
    progress: TourProgress[]
    /** users.created_at: decides "new accounts only" for the welcome tours. */
    createdAt: string | null
    /** The server's clock. */
    serverNow: string
  }
}

export interface TourEventBody {
  event: TourEvent
  version: number
  stepIndex: number | null
  stepId: string | null
  platform: TourPlatform
}

export interface TourEventResponse {
  status: string
  data: TourProgress
}
