// Deep links out of the dashboard. The analytics page keeps its drill state
// in the URL (see useAnalyticsParams), so a tile or a subject row can land the
// user on exactly the view that explains its number.

export const analyticsHref = (params: Record<string, string | null | undefined>): string => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  const qs = query.toString()
  return `/analytics${qs ? `?${qs}` : ''}`
}

export const gradebookHref = (classId: string): string => `/gradebook/${encodeURIComponent(classId)}`

export const attendanceHref = (date: string): string => `/attendance/general?date=${encodeURIComponent(date)}`
