import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  username: string | null;
}

interface NotificationState {
  message: string;
  /** 'info' is neutral: something to know, neither a success nor a failure. */
  type: 'success' | 'error' | 'info';
  duration?: number;
  isOpen: boolean;
  currentNotification: Notification | null;
  user: User;
  showNotification: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
  closeNotification: () => void;
  setUser: (user: User) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: '',
  type: 'success',
  duration: 4000,
  isOpen: false,
  currentNotification: null,
  user: {
    id: '',
    name: '',
    username: ''
  },

  showNotification: (message, type, duration = 4000) => {
    set({ message, type, isOpen: true, duration });
    setTimeout(() => {
      set({ isOpen: false });
    }, duration);
  },

  closeNotification: () => set({ isOpen: false }),

  setUser: (user: User) => set({ user }),
}));
