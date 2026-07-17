import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SchoolYear } from '@/services/types/schoolYear';

type SchoolYearStore = {
  years: SchoolYear[];
  selectedYearId: string | null;
  setYears: (years: SchoolYear[]) => void;
  selectYear: (id: string | null) => void;
  clearYears: () => void;
};

export const useSchoolYearStore = create<SchoolYearStore>()(
  persist(
    (set, get) => ({
      years: [],
      selectedYearId: null,
      setYears: (years) => {
        const { selectedYearId } = get();
        const stillExists = years.some((y) => y.schoolYearId === selectedYearId);
        const active = years.find((y) => y.isActive) || null;
        set({
          years,
          selectedYearId: stillExists ? selectedYearId : active?.schoolYearId ?? null,
        });
      },
      selectYear: (id) => set({ selectedYearId: id }),
      clearYears: () => set({ years: [], selectedYearId: null }),
    }),
    { name: 'school-year-storage', storage: createJSONStorage(() => localStorage) },
  ),
);

export const useSelectedYear = (): SchoolYear | null =>
  useSchoolYearStore((s) => s.years.find((y) => y.schoolYearId === s.selectedYearId) ?? null);
