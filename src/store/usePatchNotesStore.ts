import { create } from 'zustand'
import type { PatchNote } from '@/services/types/patchNote'

type PatchNotesStore = {
  hasUnread: boolean
  unreadNotes: PatchNote[]
  setUnread: (hasUnread: boolean, notes: PatchNote[]) => void
  clearUnread: () => void
}

export const usePatchNotesStore = create<PatchNotesStore>((set) => ({
  hasUnread: false,
  unreadNotes: [],
  setUnread: (hasUnread, notes) => set({ hasUnread, unreadNotes: notes }),
  clearUnread: () => set({ hasUnread: false, unreadNotes: [] }),
}))
