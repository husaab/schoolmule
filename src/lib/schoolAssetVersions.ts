// src/lib/schoolAssetVersions.ts
// Earlier versions of a school's logo, signature and stamp, as School Assets
// shows them. A version is the file that was live until it was replaced,
// deleted or written over by a restore (schoolmule-backend
// services/schoolAssetHistory.js keeps the newest ten of each).

import type { SchoolAssetVersion } from '@/services/types/schoolAsset'

const REASON_LABEL: Record<SchoolAssetVersion['reason'], string> = {
  replaced: 'Replaced',
  deleted: 'Deleted',
  restored_over: 'Replaced by a restore',
}

// Written out, not left to the device's locale, so the web and the app read the same.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Replaced 24 Nov 2026 by Sara Ahmed": what happened to this file, when (the reader's own day), and who did it. */
export function versionCaption(version: SchoolAssetVersion): string {
  const when = new Date(version.replacedAt)
  const day = Number.isNaN(when.getTime()) ? '' : ` ${when.getDate()} ${MONTHS[when.getMonth()]} ${when.getFullYear()}`
  const who = version.replacedByName ? ` by ${version.replacedByName}` : ''
  return `${REASON_LABEL[version.reason] ?? 'Replaced'}${day}${who}`
}

/** "412 KB", "1.2 MB"; empty when the size isn't known. */
export function versionSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "Earlier versions (3)" */
export const versionsHeading = (count: number): string => `Earlier versions (${count})`
