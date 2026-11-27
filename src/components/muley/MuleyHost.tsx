'use client'
// Muley on every signed-in page: a round button at the bottom right that
// opens the panel. Mounted once, in UserShell. It appears only when the
// server says Muley is switched on for this school and this person's view,
// and never on sign-in pages, for students, or in an admin's preview.

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import MuleyAvatar from './MuleyAvatar'
import MuleyPanel, { MuleyPresence } from './MuleyPanel'
import { useMuleyStore } from '@/store/useMuleyStore'
import { useUserStore } from '@/store/useUserStore'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { muleyVisible } from '@/lib/muley/visibility'

export default function MuleyHost() {
  const pathname = usePathname() || '/'
  const user = useUserStore((s) => s.user)
  const hydrated = useUserStore((s) => s.hasHydrated)
  const previewing = useImpersonationStore((s) => Boolean(s.session))
  const open = useMuleyStore((s) => s.open)
  const config = useMuleyStore((s) => s.config)
  const launcher = useRef<HTMLButtonElement>(null)

  const owner = hydrated && user.id && user.role ? `${user.id}:${user.role}` : null

  useEffect(() => {
    // Until the signed-in person is read back from storage, there is no one to
    // claim the panel for: claiming "nobody" then would wipe it after a reload.
    if (!hydrated) return
    const store = useMuleyStore.getState()
    store.claim(owner)
    // Students never get Muley: their account isn't asked about it at all.
    if (owner && !previewing && !owner.endsWith(':STUDENT')) void store.loadConfig()
  }, [hydrated, owner, previewing])

  const visible = muleyVisible({ pathname, user, previewing, config })

  // Close it where it doesn't belong (a sign-in page, switched off). Before
  // the server has answered, it isn't known yet, so a reload keeps it open.
  useEffect(() => {
    if (open && !visible && config.status === 'ready') useMuleyStore.getState().setOpen(false)
  }, [visible, open, config.status])

  // Open when the page was reloaded: bring the conversation back once Muley shows.
  useEffect(() => {
    if (!visible) return
    const store = useMuleyStore.getState()
    if (store.open) store.setOpen(true)
  }, [visible])

  if (!visible) return null

  const firstName = (user.fullName || user.username || '').trim().split(/\s+/)[0] || null
  const close = () => {
    useMuleyStore.getState().setOpen(false)
    requestAnimationFrame(() => launcher.current?.focus())
  }

  return (
    <>
      {!open && (
        <button
          ref={launcher}
          type="button"
          onClick={() => useMuleyStore.getState().setOpen(true)}
          aria-label="Open Muley"
          aria-expanded={false}
          title="Ask Muley"
          className="fixed bottom-4 right-4 z-[54] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(8,145,178,0.28)] ring-2 ring-cyan-200 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 pb-[env(safe-area-inset-bottom)] lg:bottom-6 lg:right-6 print:hidden"
        >
          <MuleyAvatar size={42} framed={false} />
        </button>
      )}
      <MuleyPresence open={open}>
        <MuleyPanel key="muley-panel" pathname={pathname} firstName={firstName} onClose={close} />
      </MuleyPresence>
    </>
  )
}
