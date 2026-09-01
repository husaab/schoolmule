import { create } from 'zustand';
import type {
  GenerateMeta,
  ScheduleCandidate,
  ScheduleSession,
} from '@/services/types/schedulePlanner';

export type PlannerViewMode = 'classGroup' | 'teacher' | 'day';

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
  /** Manual builder: place a new session (sessionIndex is assigned here). */
  addSession: (session: Omit<ScheduleSession, 'sessionIndex'>) => void;
  updateSession: (key: string, patch: Partial<ScheduleSession>) => void;
  removeSession: (key: string) => void;
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
  viewMode: 'day' as PlannerViewMode,
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

  // ─── Manual builder ─────────────────────────────────────────────────────
  // Manual edits invalidate the generated candidate set: the working sessions
  // no longer match any candidate, so paging back through them would silently
  // discard the edit.
  addSession: (session) =>
    set((state) => {
      const used = state.workingSessions
        .filter((s) => s.courseId === session.courseId)
        .map((s) => s.sessionIndex);
      const sessionIndex = used.length === 0 ? 0 : Math.max(...used) + 1;
      return {
        workingSessions: [...state.workingSessions, { ...session, sessionIndex }],
        candidates: [],
        meta: null,
        dirty: true,
      };
    }),

  updateSession: (key, patch) =>
    set((state) => {
      let newKey = key;
      const workingSessions = state.workingSessions.map((s) => {
        if (sessionKey(s) !== key) return s;
        const next = { ...s, ...patch };
        // sessionKey is courseId:sessionIndex, so re-pointing a session at a
        // different course must also claim a free index in that course —
        // otherwise it collides with an existing session and the two become
        // indistinguishable to delete, edit and React's key.
        if (patch.courseId && patch.courseId !== s.courseId) {
          const used = state.workingSessions
            .filter((other) => other.courseId === patch.courseId && sessionKey(other) !== key)
            .map((other) => other.sessionIndex);
          next.sessionIndex = used.length === 0 ? 0 : Math.max(...used) + 1;
        }
        newKey = sessionKey(next);
        return next;
      });

      // Carry any pin over to the new identity rather than orphaning it.
      let pinnedKeys = state.pinnedKeys;
      if (newKey !== key && pinnedKeys.has(key)) {
        pinnedKeys = new Set(pinnedKeys);
        pinnedKeys.delete(key);
        pinnedKeys.add(newKey);
      }

      return { workingSessions, pinnedKeys, candidates: [], meta: null, dirty: true };
    }),

  removeSession: (key) =>
    set((state) => {
      const pinnedKeys = new Set(state.pinnedKeys);
      pinnedKeys.delete(key);
      return {
        workingSessions: state.workingSessions.filter((s) => sessionKey(s) !== key),
        pinnedKeys,
        candidates: [],
        meta: null,
        dirty: true,
      };
    }),

  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedClassGroupId: (selectedClassGroupId) => set({ selectedClassGroupId }),
  setSelectedTeacherId: (selectedTeacherId) => set({ selectedTeacherId }),
  setDirty: (dirty) => set({ dirty }),
  reset: () => set({ ...initialState, pinnedKeys: new Set<string>() }),
}));
