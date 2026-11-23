// src/hooks/useAdminOverview.ts
// The admin panel's live facts (GET /admin/overview), for people who can
// open the panel; everyone else never asks. Reloads on a school-year switch
// (the request carries X-School-Year) and when the page calls reload() after
// an action. No polling: the panel is a place you visit, not a monitor.
'use client'

import { useAccess } from '@/hooks/useAccess'
import { useLoad, type Loaded } from '@/hooks/useLoad'
import { getAdminOverview } from '@/services/adminOverviewService'
import type { AdminOverview } from '@/services/types/adminOverview'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'

export function useAdminOverview(): Loaded<AdminOverview> {
  const { canOpen } = useAccess()
  const userId = useUserStore((s) => s.user.id)
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const scope = userId && canOpen('/admin-panel') ? `admin-overview:${userId}:${yearId ?? ''}` : null
  return useLoad(scope, () => getAdminOverview().then((res) => res.data))
}
