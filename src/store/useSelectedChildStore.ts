import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const ALL_CHILDREN = 'all';

export type ChildLite = {
  studentId: string;
  name: string;
  grade: string | number | null;
};

type SelectedChildStore = {
  children: ChildLite[];
  selectedChildId: string; // ALL_CHILDREN or a studentId
  setChildren: (children: ChildLite[]) => void;
  selectChild: (id: string) => void;
  clearChildren: () => void;
};

export const useSelectedChildStore = create<SelectedChildStore>()(
  persist(
    (set, get) => ({
      children: [],
      selectedChildId: ALL_CHILDREN,
      setChildren: (children) => {
        const { selectedChildId } = get();
        // Keep the current selection only if that child is still linked;
        // otherwise fall back to "All children".
        const stillExists =
          selectedChildId === ALL_CHILDREN ||
          children.some((c) => c.studentId === selectedChildId);
        set({
          children,
          selectedChildId: stillExists ? selectedChildId : ALL_CHILDREN,
        });
      },
      selectChild: (id) => set({ selectedChildId: id }),
      clearChildren: () => set({ children: [], selectedChildId: ALL_CHILDREN }),
    }),
    { name: 'selected-child-storage', storage: createJSONStorage(() => localStorage) },
  ),
);

/** The selected child, or null when "All children" is active. */
export const useSelectedChild = (): ChildLite | null =>
  useSelectedChildStore(
    (s) => s.children.find((c) => c.studentId === s.selectedChildId) ?? null,
  );

/** The children currently visible: one when filtered, all in "All" mode. */
export const useVisibleChildren = (): ChildLite[] => {
  const children = useSelectedChildStore((s) => s.children);
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId);
  // Derive outside the selector so the selector always returns a stable
  // reference (a fresh array per selector call would loop useSyncExternalStore).
  return selectedChildId === ALL_CHILDREN
    ? children
    : children.filter((c) => c.studentId === selectedChildId);
};

// Same pattern as useYearStoreHydrated: read the persist middleware's
// hydration flag so consumers never act on the pre-hydration default
// selection (a flash of "All children" before the stored choice loads).
export function useChildStoreHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => useSelectedChildStore.persist.onFinishHydration(onStoreChange),
    () => useSelectedChildStore.persist.hasHydrated(),
    () => false,
  );
}
