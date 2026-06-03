// src/store/useAnalyticsStore.ts
//
// Session-scoped bridge between the analytics views (which load the data)
// and the AI components (insights panel, chat drawer, report composer).
// NOT persisted — analytics data is re-fetched per session.

import { create } from 'zustand'
import {
  AnalyticsContextInput,
  serializeAnalyticsContext,
} from '@/lib/analyticsUtils'

type AnalyticsStore = {
  /** The structured snapshot of whatever view is currently on screen. */
  snapshot: AnalyticsContextInput | null
  /** serializeAnalyticsContext(snapshot) — what the AI routes consume. */
  serializedContext: string
  /** Bumps whenever the snapshot changes; AI panels watch this to re-fire. */
  contextVersion: number
  setSnapshot: (snapshot: AnalyticsContextInput) => void
  clearSnapshot: () => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  snapshot: null,
  serializedContext: '',
  contextVersion: 0,

  setSnapshot: (snapshot) =>
    set({
      snapshot,
      serializedContext: serializeAnalyticsContext(snapshot),
      contextVersion: get().contextVersion + 1,
    }),

  clearSnapshot: () => set({ snapshot: null, serializedContext: '', contextVersion: 0 }),
}))
