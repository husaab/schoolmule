import { create, StateCreator } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';
import { clearRefusedAnswers } from '@/lib/answerSaveFailure';
import { clearFilterMemory, getFilterMemoryStorage } from '@/lib/filterMemory';
import type { AvatarSpec } from '@/services/types/profile';

export type User = {
    id: string | null;
    username: string | null;
    role: string | null;
    email: string | null;
    school: string | null;
    isVerifiedEmail: boolean,
    isVerifiedSchool: boolean,
    activeTerm: string | null;
    // Platform owner (env allowlist on the backend). Optional so the other
    // setUser callers (impersonation, approvals) need no change: absent is false.
    isPlatformOwner?: boolean;
    // Dual-role view switch (staff who are also parents). `role` above is the
    // active view; `baseRole` is the database role and `roles` every view the
    // account holds. Optional: a user persisted before these existed has
    // neither, and reads as single-role until /auth/me fills them in.
    baseRole?: string | null;
    roles?: string[];
    // "First Last" as the server spells it (username is the editable handle).
    fullName?: string | null;
    // The picked avatar (null = the neutral one) and a signed URL for the
    // optional photo, which expires after a few hours and is refreshed by
    // /auth/me. Optional for the same reason as the fields above.
    avatar?: AvatarSpec | null;
    photoUrl?: string | null;
}

type UserStore = {
    user: User;
    setUser: ( newUser: User ) => void;
    clearUser: () => void;
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

type MyPersist = (
    config: StateCreator<UserStore>,
    options: PersistOptions<UserStore>
  ) => StateCreator<UserStore>
  
export const useUserStore = create<UserStore>(
    (persist as MyPersist) (
        (set) => ({
            user: {
                id: null,
                username: null,
                role: null,
                email: null,
                school: null,
                isVerifiedEmail: false,
                isVerifiedSchool: false,
                activeTerm: null
            },

            setUser: (user) => set({ user }),

            clearUser: () => {
                // Badges belong to the session that just ended.
                import('@/store/useMessagingStore').then((m) => m.useMessagingStore.getState().clear()).catch(() => {})
                // So do the remembered page filters (every sign-out path ends here).
                clearFilterMemory(getFilterMemoryStorage())
                // And a student's typed words an assignment refused to save (kept in this tab for them to copy).
                clearRefusedAnswers()
                set({
                    user: {
                        id: null,
                        username: null,
                        role: null,
                        email: null,
                        school: null,
                        isVerifiedEmail: false,
                        isVerifiedSchool: false,
                        activeTerm: null
                    }
                })
            },
            hasHydrated: false, // track hydration
            setHasHydrated: (state) => set({ hasHydrated: state }),
            
            
        }),

        {
            name: 'user-storage', // Name of the item in storage
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true); // mark as hydrated
              },
        },
    ),
    
)