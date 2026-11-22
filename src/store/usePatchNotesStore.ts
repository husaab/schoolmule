import { create } from 'zustand'
import type { PatchNote } from '@/services/types/patchNote'

type PatchNotesStore = {
  hasUnread: boolean
  unreadNotes: PatchNote[]
  setUnread: (hasUnread: boolean, notes: PatchNote[]) => void
  clearUnread: () => void
  /** The sign-in check for unread notes has finished (or doesn't apply). */
  checked: boolean
  setChecked: () => void
  /** The What's New popup is on screen. Guided tours wait for both. */
  modalOpen: boolean
  setModalOpen: (open: boolean) => void
}

export const usePatchNotesStore = create<PatchNotesStore>((set) => ({
  hasUnread: false,
  unreadNotes: [],
  setUnread: (hasUnread, notes) => set({ hasUnread, unreadNotes: notes }),
  clearUnread: () => set({ hasUnread: false, unreadNotes: [] }),
  checked: false,
  setChecked: () => set({ checked: true }),
  modalOpen: false,
  setModalOpen: (modalOpen) => set({ modalOpen }),
}))
