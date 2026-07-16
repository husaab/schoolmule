import { create } from 'zustand';
import type {
  GenerateMeta,
  ScheduleCandidate,
  ScheduleSession,
} from '@/services/types/schedulePlanner';

export type PlannerViewMode = 'classGroup' | 'teacher';

/** Stable identity for a pinnable session within a candidate. */
export const sessionKey = (s: ScheduleSession) => `${s.courseId}:${s.sessionIndex}`;

interface SchedulePlannerState {
  candidates: ScheduleCandidate[];
  meta: GenerateMeta | null;
  activeCandidateIndex: number;
  /** Sessions currently shown/edited (from the active candidate or a loaded draft) */
  workingSessions: ScheduleSession[];
  pinnedKeys: Set<string>;
  viewMode: PlannerViewMode;
  selectedClassGroupId: string | null;
  selectedTeacherId: string | null;
  dirty: boolean;

  setCandidates: (candidates: ScheduleCandidate[], meta: GenerateMeta) => void;
  selectCandidate: (index: number) => void;
  loadSessions: (sessions: ScheduleSession[]) => void;
  togglePin: (key: string) => void;
  setViewMode: (mode: PlannerViewMode) => void;
  setSelectedClassGroupId: (id: string | null) => void;
  setSelectedTeacherId: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

const initialState = {
  candidates: [] as ScheduleCandidate[],
  meta: null as GenerateMeta | null,
  activeCandidateIndex: 0,
  workingSessions: [] as ScheduleSession[],
  pinnedKeys: new Set<string>(),
  viewMode: 'classGroup' as PlannerViewMode,
  selectedClassGroupId: null as string | null,
  selectedTeacherId: null as string | null,
  dirty: false,
};

export const useSchedulePlannerStore = create<SchedulePlannerState>((set, get) => ({
  ...initialState,

  setCandidates: (candidates, meta) =>
    set((state) => ({
      candidates,
      meta,
      activeCandidateIndex: 0,
      workingSessions: candidates[0]?.sessions ?? [],
      // Keep pins across regenerations — the solver already honored them.
      pinnedKeys: new Set(
        candidates[0]?.sessions.filter((s) => state.pinnedKeys.has(sessionKey(s))).map(sessionKey) ?? []
      ),
      dirty: true,
    })),

  selectCandidate: (index) => {
    const { candidates } = get();
    if (index < 0 || index >= candidates.length) return;
    set({
      activeCandidateIndex: index,
      workingSessions: candidates[index].sessions,
      dirty: true,
    });
  },

  loadSessions: (sessions) =>
    set({
      workingSessions: sessions,
      candidates: [],
      meta: null,
      activeCandidateIndex: 0,
      pinnedKeys: new Set(sessions.filter((s) => s.pinned).map(sessionKey)),
      dirty: false,
    }),

  togglePin: (key) =>
    set((state) => {
      const pinnedKeys = new Set(state.pinnedKeys);
      if (pinnedKeys.has(key)) pinnedKeys.delete(key);
      else pinnedKeys.add(key);
      return { pinnedKeys, dirty: true };
    }),

  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedClassGroupId: (selectedClassGroupId) => set({ selectedClassGroupId }),
  setSelectedTeacherId: (selectedTeacherId) => set({ selectedTeacherId }),
  setDirty: (dirty) => set({ dirty }),
  reset: () => set({ ...initialState, pinnedKeys: new Set<string>() }),
}));
