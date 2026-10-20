import { describe, it, expect } from 'vitest'
import { pickableTeachers, defaultLead } from './classTeacherChoices'

const teachers = [{ userId: 'me' }, { userId: 'colleague' }, { userId: 'lead' }]

describe('pickableTeachers', () => {
  it('offers everyone to someone who manages classes', () => {
    expect(pickableTeachers(teachers, { managesClasses: true, selfId: 'me' })).toEqual(teachers)
  })

  it('offers only yourself on create and copy', () => {
    expect(pickableTeachers(teachers, { managesClasses: false, selfId: 'me' })).toEqual([{ userId: 'me' }])
  })

  it('keeps the current lead on edit, even for a co-teacher', () => {
    expect(pickableTeachers(teachers, { managesClasses: false, selfId: 'me', currentLeadId: 'lead' })).toEqual([{ userId: 'lead' }])
  })
})

describe('defaultLead', () => {
  it('keeps an allowed preference', () => {
    expect(defaultLead(teachers, 'colleague')).toBe('colleague')
  })

  it('falls back to the only choice, else nothing', () => {
    expect(defaultLead([{ userId: 'me' }], 'colleague')).toBe('me')
    expect(defaultLead(teachers, 'nobody')).toBe('')
  })
})
