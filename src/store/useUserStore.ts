import { create, StateCreator } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';

export type User = {
    id: string | null;
    username: string | null;
    role: string | null;
    email: string | null;
    school: string | null;
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
                school: null
            },

            setUser: (user) => set({ user }),

            clearUser: () => set({
                user: {
                    id: null,
                    username: null,
                    role: null,
                    email: null,
                    school: null
                }
            }),
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