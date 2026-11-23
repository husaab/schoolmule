import { describe, expect, it } from 'vitest'
import { progressGoalsChange, reportTeacherNameChange, tidyProgressGoals, tidyReportTeacherName } from './classReportOptions'

describe('class report options: the name on progress reports', () => {
  it('tidies spaces and treats empty as the teacher', () => {
    expect(tidyReportTeacherName('  Salaat   Supervisor ')).toBe('Salaat Supervisor')
    expect(tidyReportTeacherName('   ')).toBeNull()
    expect(tidyReportTeacherName('')).toBeNull()
  })

  it('sends only a real change', () => {
    expect(reportTeacherNameChange('Supervisor', null)).toBe('Supervisor')
    expect(reportTeacherNameChange(' Supervisor ', 'Supervisor')).toBeUndefined()
    expect(reportTeacherNameChange('', null)).toBeUndefined()
    expect(reportTeacherNameChange('  ', 'Supervisor')).toBeNull()
  })
})

describe('class report options: the goals paragraph', () => {
  it('keeps line breaks, trims the ends and treats empty as none', () => {
    expect(tidyProgressGoals('  Salah is a gift.\r\nEvery effort counts.  ')).toBe('Salah is a gift.\nEvery effort counts.')
    expect(tidyProgressGoals(' \n ')).toBeNull()
  })

  it('sends only a real change', () => {
    expect(progressGoalsChange('Salah is a gift.', null)).toBe('Salah is a gift.')
    expect(progressGoalsChange(' Salah is a gift. ', 'Salah is a gift.')).toBeUndefined()
    expect(progressGoalsChange('', 'Salah is a gift.')).toBeNull()
    expect(progressGoalsChange('  ', null)).toBeUndefined()
  })
})
