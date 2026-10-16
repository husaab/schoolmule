import { describe, it, expect } from 'vitest'
import {
  CLASS_TAB_IDS,
  classHref,
  classItemHref,
  isClassTab,
  isGradesSub,
  legacyEditRedirect,
  legacyGradebookRedirect,
  newItemHref,
  parseClassTab,
  parseGradesSub,
  teacherItemHref,
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

describe('newItemHref', () => {
  it('names the kind, then the topic and where the form was opened from', () => {
    expect(newItemHref('c1', 'assignment')).toBe('/classes/c1/items/new?kind=assignment')
    expect(newItemHref('c1', 'material', { topic: 't1' })).toBe('/classes/c1/items/new?kind=material&topic=t1')
    expect(newItemHref('c1', 'assessment', { from: 'grades' })).toBe('/classes/c1/items/new?kind=assessment&from=grades')
    expect(newItemHref('c1', 'quiz', { topic: '', from: null })).toBe('/classes/c1/items/new?kind=quiz')
  })
})

describe('teacherItemHref', () => {
  it('an assignment or quiz opens its grading view', () => {
    expect(teacherItemHref('c1', { itemId: 'i1', kind: 'assignment' })).toBe('/classes/c1/items/i1')
    expect(teacherItemHref('c1', { itemId: 'i1', kind: 'quiz' })).toBe('/classes/c1/items/i1')
  })

  it("an assessment opens its column in Grades; a material its edit page", () => {
    expect(teacherItemHref('c1', { itemId: 'i1', kind: 'assessment', assessmentId: 'a1' })).toBe(
      '/classes/c1?tab=grades&focus=a1',
    )
    expect(teacherItemHref('c1', { itemId: 'i1', kind: 'assessment', assessmentId: null })).toBe('/classes/c1/items/i1/edit')
    expect(teacherItemHref('c1', { itemId: 'i1', kind: 'material' })).toBe('/classes/c1/items/i1/edit')
  })

  it('work that is not live yet opens its edit page', () => {
    expect(teacherItemHref('c1', { itemId: 'i1', kind: 'assignment', live: false })).toBe('/classes/c1/items/i1/edit')
  })
})

describe('legacyGradebookRedirect', () => {
  it('sends the gradebook list to the Classes home, keeping its filters', () => {
    expect(legacyGradebookRedirect('/gradebook', '')).toBe('/classes')
    expect(legacyGradebookRedirect('/gradebook', '?')).toBe('/classes')
    expect(legacyGradebookRedirect('/gradebook/', '?grade=5&term=Term+1')).toBe('/classes?grade=5&term=Term+1')
    expect(legacyGradebookRedirect('/gradebook', 'subject=Math')).toBe('/classes?subject=Math')
  })

  it('opens a class gradebook as its Grades tab, keeping its params', () => {
    expect(legacyGradebookRedirect('/gradebook/c1', '')).toBe('/classes/c1?tab=grades')
    expect(legacyGradebookRedirect('/gradebook/c1', '?q=Amal')).toBe('/classes/c1?tab=grades&q=Amal')
  })

  it('turns the old Assessments view into the setup sub-tab', () => {
    expect(legacyGradebookRedirect('/gradebook/c1', '?view=assessments')).toBe('/classes/c1?tab=grades&sub=setup')
    expect(legacyGradebookRedirect('/gradebook/c1', '?view=assessments&x=1')).toBe('/classes/c1?tab=grades&sub=setup&x=1')
    // The old default view (grade entry) is the Scores sub-tab, the bare Grades URL.
    expect(legacyGradebookRedirect('/gradebook/c1', '?view=grades')).toBe('/classes/c1?tab=grades')
  })

  it('never lets an old param pick another tab', () => {
    expect(legacyGradebookRedirect('/gradebook/c1', '?tab=settings')).toBe('/classes/c1?tab=grades')
  })

  it('sends the comment pages to their sub-tabs', () => {
    expect(legacyGradebookRedirect('/gradebook/c1/feedback', '?term=Term+1')).toBe(
      '/classes/c1?tab=grades&sub=report-comments',
    )
    expect(legacyGradebookRedirect('/gradebook/c1/progress', '')).toBe('/classes/c1?tab=grades&sub=progress-comments')
  })

  it('opens JK and SK gradebooks on the Grades tab', () => {
    expect(legacyGradebookRedirect('/gradebook/jk/c2', '?tab=report_card&student=s1')).toBe('/classes/c2?tab=grades')
    expect(legacyGradebookRedirect('/gradebook/sk/c3', '')).toBe('/classes/c3?tab=grades')
  })

  it('keeps an encoded class id encoded once', () => {
    expect(legacyGradebookRedirect('/gradebook/a%20b', '')).toBe('/classes/a%20b?tab=grades')
  })

  it('sends anything else to the Classes home', () => {
    expect(legacyGradebookRedirect('/gradebook/c1/other', '')).toBe('/classes')
    expect(legacyGradebookRedirect('/gradebook/jk', '')).toBe('/classes')
    expect(legacyGradebookRedirect('/gradebook/jk/c2/extra', '')).toBe('/classes')
    expect(legacyGradebookRedirect('/somewhere', '')).toBe('/classes')
  })
})

describe('grades sub-tabs', () => {
  it('recognises the four sub-tabs; anything else is Scores', () => {
    expect(isGradesSub('setup')).toBe(true)
    expect(isGradesSub('assessments')).toBe(false)
    expect(parseGradesSub('report-comments')).toBe('report-comments')
    expect(parseGradesSub('progress-comments')).toBe('progress-comments')
    expect(parseGradesSub('')).toBe('scores')
    expect(parseGradesSub(null)).toBe('scores')
    expect(parseGradesSub('nope')).toBe('scores')
  })
})
