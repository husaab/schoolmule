import { create } from 'zustand';
import { getSchoolSchedule } from '@/services/schedulePlannerService';
import type { MySchedule } from '@/services/types/schedulePlanner';

// The whole-school published timetable for the /school-schedule page.
//
// Deliberately separate from useMyScheduleStore: that one hands teachers only
// their own sessions, which is what the navbar menu and dashboard want. On
// this page a teacher wants everyone's — to find where a class is, or which
// colleague is free — so it always asks for the school-wide snapshot.

interface SchoolScheduleState {
  data: MySchedule | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  /** In-flight request, so concurrent mounts share one fetch. */
  inFlight: Promise<void> | null;
  load: (force?: boolean) => Promise<void>;
  clear: () => void;
}

export const useSchoolScheduleStore = create<SchoolScheduleState>((set, get) => ({
  data: null,
  loading: false,
  loaded: false,
  error: null,
  inFlight: null,

  load: async (force = false) => {
    const { loaded, inFlight } = get();
    if (inFlight) return inFlight;
    if (loaded && !force) return;

    set({ loading: true, error: null });
    const request = getSchoolSchedule()
      .then((res) => {
        // No published schedule is a normal empty state, not an error.
        set({ data: res.status === 'success' ? res.data : null, loaded: true });
      })
      .catch((err: unknown) => {
        set({
          error: err instanceof Error ? err.message : 'Error loading the school schedule',
          loaded: true,
        });
      })
      .finally(() => set({ loading: false, inFlight: null }));

    set({ inFlight: request });
    return request;
  },

  clear: () => set({ data: null, loaded: false, error: null, inFlight: null }),
}));
