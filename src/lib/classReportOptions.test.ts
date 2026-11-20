import { describe, expect, it } from 'vitest'
import { reportTeacherNameChange, tidyReportTeacherName } from './classReportOptions'

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
