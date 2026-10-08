import { create } from 'zustand';
import { getUnreadSummary } from '@/services/messagingService';
import type { UnreadSummary } from '@/services/types/messaging';

// Unread message counts, shared by the sidebar pill, the navbar bell and the
// inbox stat strip. One poll per tab (module-level timer), paused while the
// tab is hidden, so three badges cost one request every 30 seconds.
//
// bump() is for optimistic refreshes after the user acts (reads a thread,
// sends a reply): it re-fetches immediately instead of waiting for the tick.

const POLL_MS = 30_000;
const EMPTY: UnreadSummary = { unreadConversations: 0, unreadMessages: 0, needsReply: 0 };

let timer: ReturnType<typeof setInterval> | null = null;
let visibilityBound = false;

interface MessagingState {
  summary: UnreadSummary;
  loaded: boolean;
  inFlight: Promise<void> | null;
  load: (force?: boolean) => Promise<void>;
  bump: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  clear: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  summary: EMPTY,
  loaded: false,
  inFlight: null,

  load: async (force = false) => {
    const { loaded, inFlight } = get();
    if (inFlight) return inFlight;
    if (loaded && !force) return;

    const request = getUnreadSummary()
      .then((res) => {
        set({ summary: res.status === 'success' && res.data ? res.data : EMPTY, loaded: true });
      })
      .catch(() => {
        // A badge is not worth an error toast; keep the last known count.
        set({ loaded: true });
      })
      .finally(() => set({ inFlight: null }));

    set({ inFlight: request });
    return request;
  },

  bump: () => get().load(true),

  startPolling: () => {
    if (typeof window === 'undefined' || timer) return;
    void get().load(true);
    timer = setInterval(() => {
      if (document.hidden) return;
      void get().load(true);
    }, POLL_MS);
    if (!visibilityBound) {
      visibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && timer) void get().load(true);
      });
    }
  },

  stopPolling: () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },

  clear: () => {
    get().stopPolling();
    set({ summary: EMPTY, loaded: false, inFlight: null });
  },
}));
