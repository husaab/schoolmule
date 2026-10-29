/**
 * An assessment's date as parents see it: 'Oct 1, 2026', or null when the
 * teacher set none. Assessment dates are calendar days ('YYYY-MM-DD'; older
 * payloads sent a midnight timestamp), so only the day part is read and it is
 * formatted at noon UTC, never shifted by the viewer's timezone.
 */
export function formatAssessmentDate(date: string | null | undefined): string | null {
  const day = date?.slice(0, 10)
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const d = new Date(`${day}T12:00:00Z`)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-CA', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
}
