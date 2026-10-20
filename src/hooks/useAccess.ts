'use client'

// The signed-in user's access (lib/permissions) for components: what they
// hold, plus `can` and `canOpen` bound to them. Recomputed only when the
// session changes (setUser replaces the user object).

import { useMemo } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { accessInfo, canOpenPath, type AccessInfo, type Permission } from '@/lib/permissions'

export type Access = AccessInfo & {
  can: (key: Permission) => boolean
  canAny: (...keys: Permission[]) => boolean
  canOpen: (path: string) => boolean
}

export const useAccess = (): Access => {
  const user = useUserStore((s) => s.user)
  return useMemo(() => {
    const info = accessInfo(user)
    return {
      ...info,
      can: (key) => info.permissions.has(key),
      canAny: (...keys) => keys.some((k) => info.permissions.has(k)),
      canOpen: (path) => canOpenPath(path, user),
    }
  }, [user])
}
