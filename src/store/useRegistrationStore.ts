import { create } from 'zustand';

interface RegistrationStore {
  newSubmissionCount: number;
  setNewSubmissionCount: (count: number) => void;
}

export const useRegistrationStore = create<RegistrationStore>((set) => ({
  newSubmissionCount: 0,
  setNewSubmissionCount: (count) => set({ newSubmissionCount: count }),
}));
