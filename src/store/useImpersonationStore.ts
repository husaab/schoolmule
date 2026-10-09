import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Admin "view as" preview. While active, `auth_token` holds a short-lived
 * read-only token for the previewed teacher or parent and the admin's own
 * token is parked here so "Exit preview" can restore it. Persisted so the
 * banner and the way back survive a reload.
 */
export type ImpersonationSession = {
  /** The admin's real session token, restored on exit. */
  adminToken: string;
  admin: { userId: string; fullName: string };
  /** `role` is the portal being previewed; `baseRole` the account's own role when they differ (teacher previewed as parent). */
  target: { userId: string; fullName: string; role: string; baseRole?: string };
  startedAt: string;
};

type ImpersonationStore = {
  session: ImpersonationSession | null;
  hasHydrated: boolean;
  setSession: (session: ImpersonationSession) => void;
  clearSession: () => void;
  setHasHydrated: (state: boolean) => void;
};

export const useImpersonationStore = create<ImpersonationStore>()(
  persist<ImpersonationStore, [], [], Pick<ImpersonationStore, 'session'>>(
    (set) => ({
      session: null,
      hasHydrated: false,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'impersonation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
