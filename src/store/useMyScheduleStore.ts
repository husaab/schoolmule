import { create } from 'zustand';
import { getMySchedule } from '@/services/schedulePlannerService';
import type { MySchedule } from '@/services/types/schedulePlanner';

// The teacher's published timetable is read by three surfaces at once (navbar
// menu, dashboard hero, /my-schedule page). Sharing one store keeps that to a
// single request per school year instead of one per mounted component.

interface MyScheduleState {
  data: MySchedule | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  /** In-flight request, so concurrent mounts share one fetch. */
  inFlight: Promise<void> | null;
  load: (force?: boolean) => Promise<void>;
  clear: () => void;
}

export const useMyScheduleStore = create<MyScheduleState>((set, get) => ({
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
    const request = getMySchedule()
      .then((res) => {
        // A school not using the planner has no published schedule; that is a
        // normal empty state, not an error.
        set({ data: res.status === 'success' ? res.data : null, loaded: true });
      })
      .catch((err: unknown) => {
        set({
          error: err instanceof Error ? err.message : 'Error loading schedule',
          loaded: true,
        });
      })
      .finally(() => set({ loading: false, inFlight: null }));

    set({ inFlight: request });
    return request;
  },

  clear: () => set({ data: null, loaded: false, error: null, inFlight: null }),
}));
