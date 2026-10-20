import { describe, expect, it } from 'vitest'
import { ASK_LINK_PARAMS, ASK_LINK_SELF, ASK_LINK_STALE, CLEAR_ASK_LINK, parseAskLink, resolveAskLink, type AskLink } from './askLink'
import { DEFAULT_TRANSIENT_KEYS } from './filterMemory'
import type { ParentTargets } from '@/services/types/messaging'

// Synthetic ids only.
const CHILD = '11111111-1111-4111-8111-111111111111'
const ENGLISH = '22222222-2222-4222-8222-222222222222'
const SPELLING_4 = '33333333-3333-4333-8333-333333333333'
const TEACHER = '44444444-4444-4444-8444-444444444444'

const getter = (query: string) => {
  const params = new URLSearchParams(query)
  return (key: string) => params.get(key) ?? ''
}

describe('parseAskLink', () => {
  it('reads the child, class, assessment and title the email carries', () => {
    expect(parseAskLink(getter(`tab=conversations&ask=${CHILD}&askClass=${ENGLISH}&askAssessment=${SPELLING_4}&askAbout=Spelling%204`))).toEqual({
      studentId: CHILD, classId: ENGLISH, assessmentId: SPELLING_4, about: 'Spelling 4',
    })
    expect(parseAskLink(getter(`ask=${CHILD}&askClass=${ENGLISH}`))).toEqual({ studentId: CHILD, classId: ENGLISH, assessmentId: null, about: null })
  })

  it('ignores an address without the link, or with a malformed id', () => {
    expect(parseAskLink(getter('tab=conversations'))).toBeNull()
    expect(parseAskLink(getter(`ask=${CHILD}`))).toBeNull()
    expect(parseAskLink(getter(`ask=not-an-id&askClass=${ENGLISH}`))).toBeNull()
    expect(parseAskLink(getter(`ask=${CHILD}&askClass=${ENGLISH}&askAssessment=x`))).toBeNull()
  })

  it('keeps the title to one short line', () => {
    const link = parseAskLink(getter(`ask=${CHILD}&askClass=${ENGLISH}&askAbout=${encodeURIComponent(`  Fractions\n${'x'.repeat(200)}`)}`))
    expect(link?.about?.startsWith('Fractions x')).toBe(true)
    expect(link?.about).toHaveLength(100)
  })

  it('never lets filter memory remember the link, and clears every key', () => {
    for (const key of Object.values(ASK_LINK_PARAMS)) {
      expect(DEFAULT_TRANSIENT_KEYS).toContain(key)
      expect(CLEAR_ASK_LINK[key]).toBeNull()
    }
  })
})

describe('resolveAskLink', () => {
  const targets: ParentTargets = {
    currentTerm: { termId: 't1', name: 'Term 1' },
    classes: [{
      classId: ENGLISH, subject: 'English', teacherId: TEACHER, teacherName: 'Sara Clarke',
      assessments: [{ assessmentId: SPELLING_4, name: 'Spelling 4', date: null, conversationId: null }],
    }],
    teachers: [{ userId: TEACHER, name: 'Sara Clarke', via: 'English', role: 'TEACHER' }],
  }
  const link = (over: Partial<AskLink> = {}): AskLink => ({ studentId: CHILD, classId: ENGLISH, assessmentId: SPELLING_4, about: 'Spelling 4', ...over })

  it('opens a message about a shared assessment', () => {
    expect(resolveAskLink(link(), targets)).toEqual({
      kind: 'compose', preset: { studentId: CHILD, mode: 'assessment', assessmentId: SPELLING_4 },
    })
  })

  it("writes a General message to the class teacher about work that isn't shared", () => {
    const missingWork = link({ assessmentId: '55555555-5555-4555-8555-555555555555', about: 'Fractions worksheet' })
    expect(resolveAskLink(missingWork, targets)).toEqual({
      kind: 'compose',
      preset: { studentId: CHILD, mode: 'general', teacherId: TEACHER, classId: ENGLISH, title: 'About Fractions worksheet' },
    })
    expect(resolveAskLink(link({ assessmentId: null, about: null }), targets)).toMatchObject({ preset: { title: 'Question about English' } })
  })

  it("can't start anything about a class no longer offered, or a teacher who can't be written to", () => {
    expect(resolveAskLink(link(), { ...targets, classes: [] })).toEqual({ kind: 'unavailable', message: ASK_LINK_STALE })
    expect(resolveAskLink(link({ assessmentId: null }), { ...targets, teachers: [] })).toEqual({ kind: 'unavailable', message: ASK_LINK_STALE })
  })

  it('never has a teacher in parent view write to themself', () => {
    expect(resolveAskLink(link(), targets, TEACHER)).toEqual({ kind: 'unavailable', message: ASK_LINK_SELF })
  })
})
