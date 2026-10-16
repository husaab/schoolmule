import { describe, it, expect } from 'vitest'
import {
  CLASS_TAB_IDS,
  classHref,
  classItemHref,
  isClassTab,
  legacyEditRedirect,
  parseClassTab,
} from './classroomRoutes'

describe('classHref', () => {
  it('opens the Stream with a bare URL', () => {
    expect(classHref('c1')).toBe('/classes/c1')
    expect(classHref('c1', 'stream')).toBe('/classes/c1')
  })

  it('puts the tab first, then the params', () => {
    expect(classHref('c1', 'grades', { sub: 'setup' })).toBe('/classes/c1?tab=grades&sub=setup')
    expect(classHref('c1', 'settings')).toBe('/classes/c1?tab=settings')
  })

  it('drops empty params', () => {
    expect(classHref('c1', 'grades', { sub: '', focus: null, q: undefined })).toBe('/classes/c1?tab=grades')
    expect(classHref('c1', 'stream', { compose: '1', empty: '' })).toBe('/classes/c1?compose=1')
  })

  it('appends a hash, with or without its #', () => {
    expect(classHref('c1', 'settings', {}, '#students')).toBe('/classes/c1?tab=settings#students')
    expect(classHref('c1', 'settings', {}, 'teachers')).toBe('/classes/c1?tab=settings#teachers')
    expect(classHref('c1', 'stream', {}, '#')).toBe('/classes/c1')
  })

  it('encodes the class id and the values', () => {
    expect(classHref('a b', 'people', { q: 'Amal & co' })).toBe('/classes/a%20b?tab=people&q=Amal+%26+co')
  })
})

describe('legacyEditRedirect', () => {
  it('sends #assessments to the Grades setup', () => {
    expect(legacyEditRedirect('c1', '#assessments')).toBe('/classes/c1?tab=grades&sub=setup')
  })

  it('keeps any other section hash on Settings', () => {
    expect(legacyEditRedirect('c1', '#students')).toBe('/classes/c1?tab=settings#students')
    expect(legacyEditRedirect('c1', '#teachers')).toBe('/classes/c1?tab=settings#teachers')
  })

  it('lands on Settings with no hash', () => {
    expect(legacyEditRedirect('c1', '')).toBe('/classes/c1?tab=settings')
    expect(legacyEditRedirect('c1', '#')).toBe('/classes/c1?tab=settings')
  })
})

describe('tabs', () => {
  it('lists the five tabs in page order', () => {
    expect(CLASS_TAB_IDS).toEqual(['stream', 'classwork', 'grades', 'people', 'settings'])
  })

  it('recognises tab ids', () => {
    expect(isClassTab('grades')).toBe(true)
    expect(isClassTab('gradebook')).toBe(false)
    expect(isClassTab('')).toBe(false)
  })

  it('falls back to the Stream for a missing or unknown tab', () => {
    expect(parseClassTab('people')).toBe('people')
    expect(parseClassTab('')).toBe('stream')
    expect(parseClassTab(null)).toBe('stream')
    expect(parseClassTab('edit')).toBe('stream')
  })
})

describe('classItemHref', () => {
  it('opens an item, or its edit page', () => {
    expect(classItemHref('c1', 'i9')).toBe('/classes/c1/items/i9')
    expect(classItemHref('c1', 'i9', 'edit')).toBe('/classes/c1/items/i9/edit')
  })
})
