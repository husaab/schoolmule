'use client'
import { useSyncExternalStore } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { getToken } from '@/services/authService'
import { signedInHome, type SignedInHome } from './signedInHome'

const noSubscription = () => () => {}

// The session lives in this browser's storage, so the server render and
// hydration are always signed out; a signed-in visitor's links switch right
// after hydration.
export function useSignedInHome(): SignedInHome | null {
  const onClient = useSyncExternalStore(noSubscription, () => true, () => false)
  const user = useUserStore((s) => s.user)
  const hydrated = useUserStore((s) => s.hasHydrated)
  if (!onClient || !hydrated) return null
  return signedInHome(user, Boolean(getToken()))
}
