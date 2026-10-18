// src/lib/pollTimer.ts
// One shared timer for a background poll that several views ask for at once
// (the student shell's sidebar and phone tabs both show the Messages badge,
// and every page remounts the shell). Rules:
//  - at most one request per interval: the next one is due `everyMs` after the
//    last attempt (`lastAt`), however it was started (this timer, a focus
//    event, the page that just changed something);
//  - nothing is requested while the tab is hidden; the view that sees the tab
//    come back asks for the refresh itself and that attempt re-arms the timer;
//  - with no view asking, no timer runs at all.

export interface PollTimerOptions {
  /** The shortest time between two requests. */
  everyMs: number
  /** When the last request was started (0 when none yet). */
  lastAt: () => number
  isVisible: () => boolean
  /** Sends the request; it must call `rearm()` once it finishes (or fails). */
  poll: () => void
  now?: () => number
}

export interface PollTimer {
  /** A view needs the poll; call the returned function when it goes away. */
  acquire: () => () => void
  /** A request just started or ended: the next one is a full interval after it. */
  rearm: () => void
  /** Whether a timer is currently waiting (tests). */
  armed: () => boolean
}

export function createPollTimer({ everyMs, lastAt, isVisible, poll, now = Date.now }: PollTimerOptions): PollTimer {
  let users = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  const stop = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const rearm = () => {
    stop()
    if (users === 0) return
    const wait = Math.max(0, lastAt() + everyMs - now())
    timer = setTimeout(() => {
      timer = null
      if (users === 0 || !isVisible()) return
      poll()
    }, wait)
  }

  const acquire = () => {
    users += 1
    if (timer === null) rearm()
    let released = false
    return () => {
      if (released) return
      released = true
      users -= 1
      if (users === 0) stop()
    }
  }

  return { acquire, rearm, armed: () => timer !== null }
}

/**
 * Whether an automatic refresh (mount, focus, tab visible again) should send a
 * request now: not while one is on its way, and not within `everyMs` of the
 * last attempt for the same signed-in user. A forced refresh (the page just
 * changed something) only waits for the one on its way.
 */
export function refreshDue(args: {
  force: boolean
  inFlight: boolean
  sameUser: boolean
  lastAt: number
  now: number
  everyMs: number
}): boolean {
  if (args.inFlight) return false
  if (args.force) return true
  return !(args.sameUser && args.now - args.lastAt < args.everyMs)
}
