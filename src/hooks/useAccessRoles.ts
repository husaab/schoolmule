'use client'

// The school's custom access roles, for the Users page's access-role picker.
// Only full admins may assign one, so only they ask (the API is full-admin
// only); a failed load leaves just the built-ins to pick from.

import { useEffect, useState } from 'react'
import { getAccessRoles } from '@/services/accessRoleService'
import type { AccessRole } from '@/services/types/accessRole'

export const useAccessRoles = (enabled: boolean) => {
  const [roles, setRoles] = useState<AccessRole[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getAccessRoles()
      .then((res) => {
        if (!cancelled) setRoles([...res.data.roles].sort((a, b) => a.name.localeCompare(b.name)))
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { roles: roles ?? [], loading: enabled && roles === null && !failed, failed }
}
