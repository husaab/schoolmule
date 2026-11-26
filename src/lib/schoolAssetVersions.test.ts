import { describe, expect, it } from 'vitest'
import { versionCaption, versionSize, versionsHeading } from './schoolAssetVersions'
import type { SchoolAssetVersion } from '@/services/types/schoolAsset'

const version = (over: Partial<SchoolAssetVersion> = {}): SchoolAssetVersion => ({
  versionId: 'v1',
  assetType: 'school_stamp',
  reason: 'replaced',
  replacedAt: '2026-11-24T17:00:00.000Z', // midday in Toronto: the same day in every zone the app is used in
  replacedByName: 'Sara Ahmed',
  contentType: 'image/png',
  byteSize: 421_888,
  previewUrl: 'https://example.test/v1.png',
  ...over,
})

describe('versionCaption', () => {
  it('says what happened, when and who did it', () => {
    expect(versionCaption(version())).toBe('Replaced 24 Nov 2026 by Sara Ahmed')
  })

  it('names a delete and a restore differently', () => {
    expect(versionCaption(version({ reason: 'deleted' }))).toBe('Deleted 24 Nov 2026 by Sara Ahmed')
    expect(versionCaption(version({ reason: 'restored_over' }))).toBe('Replaced by a restore 24 Nov 2026 by Sara Ahmed')
  })

  it('leaves out a name or a date it does not have', () => {
    expect(versionCaption(version({ replacedByName: null }))).toBe('Replaced 24 Nov 2026')
    expect(versionCaption(version({ replacedAt: 'not a date', replacedByName: null }))).toBe('Replaced')
  })
})

describe('versionSize', () => {
  it('reads as bytes, kilobytes or megabytes', () => {
    expect(versionSize(512)).toBe('512 B')
    expect(versionSize(421_888)).toBe('412 KB')
    expect(versionSize(1_300_000)).toBe('1.2 MB')
  })

  it('is empty when the size is unknown', () => {
    expect(versionSize(null)).toBe('')
    expect(versionSize(0)).toBe('')
  })
})

describe('versionsHeading', () => {
  it('counts the versions', () => {
    expect(versionsHeading(3)).toBe('Earlier versions (3)')
  })
})
