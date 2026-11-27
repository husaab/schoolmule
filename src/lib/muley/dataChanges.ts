// src/lib/muley/dataChanges.ts
// When the person saves or undoes a change in Muley's panel, the page beside
// the panel may be showing the same data (the gradebook of that class, the
// attendance roll for that day). The store announces what the save touched,
// as the server named it, and an open page that shows it reloads.
//
// Topics: "attendance:class:<classId>:<date>", "attendance:general:<date>"
// (the school's daily attendance), "scores:<classId>",
// "stats-exclusions:<classId>" (who counts in the class average) and
// "school-assets:<schoolCode>" (the logo, stamp and principal signature) and
// "report-comments:<classId>" (a class's report card comments).

type Listener = (topics: string[]) => void

const listeners = new Set<Listener>()

/** Tell every open page that these topics changed. */
export function announceDataChange(topics: string[]): void {
  if (!topics.length) return
  for (const listener of [...listeners]) {
    try {
      listener(topics)
    } catch (err) {
      // One page failing to reload must not stop the others, or the save.
      console.error('A page could not take in a change saved through Muley', err)
    }
  }
}

/** Listen for changes saved through Muley. -> a function that stops listening. */
export function onDataChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const classAttendanceTopic = (classId: string, date: string) => `attendance:class:${classId}:${date}`
export const generalAttendanceTopic = (date: string) => `attendance:general:${date}`
export const scoresTopic = (classId: string) => `scores:${classId}`
export const statsExclusionsTopic = (classId: string) => `stats-exclusions:${classId}`
export const schoolAssetsTopic = (schoolCode: string) => `school-assets:${schoolCode}`
export const reportCommentsTopic = (classId: string) => `report-comments:${classId}`
