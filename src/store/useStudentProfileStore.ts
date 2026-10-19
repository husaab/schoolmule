import { create } from 'zustand'

// The student profile modal opens over any page. When it edits, archives or
// deletes a student it bumps changeVersion, and a page listing students (the
// Students list) refetches so what sits underneath stays current.
interface StudentProfileState {
  changeVersion: number
  notifyChanged: () => void
}

export const useStudentProfileStore = create<StudentProfileState>((set) => ({
  changeVersion: 0,
  notifyChanged: () => set((s) => ({ changeVersion: s.changeVersion + 1 })),
}))
