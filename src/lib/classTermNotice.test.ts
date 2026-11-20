import { describe, expect, it } from 'vitest'
import { classTermNotice, classTermNoticeText } from './classTermNotice'

const term = (termId: string, name: string, startDate: string, endDate: string, academicYear: string, isActive = false) => ({
  termId,
  name,
  startDate,
  endDate,
  academicYear,
  isActive,
})

const TERMS = [
  term('t1', 'Term 1', '2026-09-02', '2027-01-31', '2026-2027', true),
  term('t2', 'Term 2', '2027-02-01', '2027-06-30', '2026-2027'),
  term('old2', 'Term 2', '2026-02-01', '2026-06-30', '2025-2026'),
]
const TODAY = '2026-11-20'

describe('classTermNotice', () => {
  it('says nothing for a class on the current term', () => {
    expect(classTermNotice('t1', TERMS, TODAY)).toBeNull()
  })

  it("warns for a class on a term that hasn't started", () => {
    const n = classTermNotice('t2', TERMS, TODAY)
    expect(n).toEqual({ classTerm: 'Term 2', currentTerm: 'Term 1', startsOn: '2027-02-01', endedOn: null })
    expect(classTermNoticeText(n!)).toEqual({
      title: 'This class is set to Term 2 (starts February 1, 2027)',
      body: "What you enter here saves to Term 2 and prints on Term 2 reports. For Term 1, the current term, use this grade's Term 1 class.",
    })
  })

  it('reads the API\'s timestamped dates as calendar days', () => {
    const terms = TERMS.map((t) => ({ ...t, startDate: `${t.startDate}T05:00:00.000Z`, endDate: `${t.endDate}T05:00:00.000Z` }))
    const n = classTermNotice('t2', terms, TODAY)
    expect(n).toMatchObject({ startsOn: '2027-02-01', endedOn: null })
    expect(classTermNoticeText(n!).title).toBe('This class is set to Term 2 (starts February 1, 2027)')
    // The last day of a term is still that term, not "ended".
    expect(classTermNotice('t1', [term('t1', 'Term 1', '2026-09-02', '2027-01-31T05:00:00.000Z', '2026-2027'), { ...TERMS[1], isActive: true }], '2027-01-31')).toMatchObject({ endedOn: null })
  })

  it('warns for a class on a term that has ended', () => {
    const terms = [term('t1', 'Term 1', '2026-09-02', '2027-01-31', '2026-2027'), term('t2', 'Term 2', '2027-02-01', '2027-06-30', '2026-2027', true)]
    const n = classTermNotice('t1', terms, '2027-03-01')
    expect(n).toMatchObject({ startsOn: null, endedOn: '2027-01-31' })
    expect(classTermNoticeText(n!).title).toBe('This class is set to Term 1 (ended January 31, 2027)')
  })

  it("says nothing for another year's class, an unknown term, or no current term", () => {
    expect(classTermNotice('old2', TERMS, TODAY)).toBeNull()
    expect(classTermNotice('nope', TERMS, TODAY)).toBeNull()
    expect(classTermNotice(null, TERMS, TODAY)).toBeNull()
    expect(classTermNotice('t2', TERMS.map((t) => ({ ...t, isActive: false })), TODAY)).toBeNull()
  })

  it('still warns, without a date, when the current term was switched early', () => {
    const terms = [term('t1', 'Term 1', '2026-09-02', '2027-01-31', '2026-2027'), term('t2', 'Term 2', '2027-02-01', '2027-06-30', '2026-2027', true)]
    const n = classTermNotice('t1', terms, '2027-01-20')
    expect(n).toMatchObject({ startsOn: null, endedOn: null })
    expect(classTermNoticeText(n!).title).toBe('This class is set to Term 1')
  })
})
