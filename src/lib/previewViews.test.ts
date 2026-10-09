import { describe, it, expect } from 'vitest'
import { previewViewsFor } from './previewViews'

describe('previewViewsFor', () => {
  it('offers both portals for a teacher who is also a parent', () => {
    expect(previewViewsFor('TEACHER', true)).toEqual(['TEACHER', 'PARENT'])
  })
  it('offers only the staff portal for a teacher with no linked children', () => {
    expect(previewViewsFor('TEACHER', false)).toEqual(['TEACHER'])
  })
  it('offers only the parent portal for a parent account, whatever the links say', () => {
    expect(previewViewsFor('PARENT', true)).toEqual(['PARENT'])
    expect(previewViewsFor('PARENT', false)).toEqual(['PARENT'])
  })
  it('offers nothing extra until the children are known', () => {
    expect(previewViewsFor('TEACHER', null)).toEqual(['TEACHER'])
  })
})
