// src/store/useObserveStore.ts
import { create } from 'zustand'
import type { WindowKey } from '@/services/types/observe'

export const WINDOW_KEYS: WindowKey[] = ['1h', '24h', '7d', '30d']
export const isWindowKey = (v: unknown): v is WindowKey => typeof v === 'string' && (WINDOW_KEYS as string[]).includes(v)

interface ObserveStore {
  window: WindowKey
  setWindow: (w: WindowKey) => void
  live: boolean
  setLive: (v: boolean) => void
  lastRefreshed: number | null
  setLastRefreshed: (t: number) => void
}

export const useObserveStore = create<ObserveStore>((set) => ({
  window: '24h',
  setWindow: (window) => set({ window }),
  live: true,
  setLive: (live) => set({ live }),
  lastRefreshed: null,
  setLastRefreshed: (lastRefreshed) => set({ lastRefreshed }),
}))
