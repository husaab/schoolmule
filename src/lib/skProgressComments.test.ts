import { describe, it, expect } from 'vitest'
import { SK_PROGRESS_COMMENT_ROWS, ratedStandardsForRow } from './skProgressComments'

const subject = (name: string, standards: string[]) => ({
  name,
  standards: standards.map((n, i) => ({ standardId: `${name}#${i}`, name: n })),
})

const SUBJECTS = [
  subject('Mathematics', ['Counts to 100', 'Builds shapes']),
  subject('Language', ['Takes turns']),
  subject('Literacy - Reading', ['Reads sight words']),
  subject('Literacy - Writing', ['Prints letters']),
  subject('Science and Social Studies', ['Makes observations']),
  subject('Arabic and Quran', ['Recognizes and writes Arabic Letters', 'Overall participation', 'Memorizes and Pronounces Surahs Independently']),
  subject('French', ['Basic vocabulary']),
]

const row = (key: string) => SK_PROGRESS_COMMENT_ROWS.find((r) => r.key === key)!

describe('SK progress report comment rows', () => {
  it('are the nine rows of the paper template, in its order', () => {
    expect(SK_PROGRESS_COMMENT_ROWS.map((r) => r.label)).toEqual([
      'Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Quran', 'Arabic', 'Islamic Studies', 'Creativity', 'French',
    ])
    expect(new Set(SK_PROGRESS_COMMENT_ROWS.map((r) => r.key)).size).toBe(9)
  })

  it('Language Arts is written from Language and both Literacy subjects', () => {
    const ratings = { 'Language#0': 'G', 'Literacy - Reading#0': 'S', 'Literacy - Writing#0': 'NI', 'Mathematics#0': 'E' }
    expect(ratedStandardsForRow(row('language_arts'), SUBJECTS, ratings)).toEqual([
      { name: 'Takes turns', rating: 'G', description: undefined },
      { name: 'Reads sight words', rating: 'S', description: undefined },
      { name: 'Prints letters', rating: 'NI', description: undefined },
    ])
  })

  it('Science and Social Studies feeds both rows; Quran and Arabic each take their own standards', () => {
    const ratings = {
      'Science and Social Studies#0': 'G',
      'Arabic and Quran#0': 'S',
      'Arabic and Quran#1': 'G',
      'Arabic and Quran#2': 'E',
    }
    expect(ratedStandardsForRow(row('science'), SUBJECTS, ratings).map((s) => s.name)).toEqual(['Makes observations'])
    expect(ratedStandardsForRow(row('social_studies'), SUBJECTS, ratings).map((s) => s.name)).toEqual(['Makes observations'])
    expect(ratedStandardsForRow(row('quran'), SUBJECTS, ratings).map((s) => s.name)).toEqual([
      'Overall participation',
      'Memorizes and Pronounces Surahs Independently',
    ])
    expect(ratedStandardsForRow(row('arabic'), SUBJECTS, ratings).map((s) => s.name)).toEqual([
      'Recognizes and writes Arabic Letters',
      'Overall participation',
    ])
  })

  it('leaves out unrated standards, and is empty when nothing it covers is rated', () => {
    expect(ratedStandardsForRow(row('mathematics'), SUBJECTS, { 'Mathematics#1': 'G', 'Mathematics#0': '' })).toEqual([
      { name: 'Builds shapes', rating: 'G', description: undefined },
    ])
    expect(ratedStandardsForRow(row('islamic_studies'), SUBJECTS, { 'Mathematics#0': 'G' })).toEqual([])
  })
})
