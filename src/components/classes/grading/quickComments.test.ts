import { describe, expect, it } from 'vitest'
import { appendQuickComment, QUICK_COMMENTS } from './quickComments'

describe('quick comments', () => {
  it('offers the board’s three chips, in order', () => {
    expect(QUICK_COMMENTS.map((c) => c.label)).toEqual(['Great labelling', 'Check your spelling', 'See me in class'])
  })

  it('a chip starts the feedback when it is empty', () => {
    expect(appendQuickComment('', 'Great labelling.')).toBe('Great labelling.')
    expect(appendQuickComment('   \n', 'Great labelling.')).toBe('Great labelling.')
  })

  it('a chip is added after what is written, with one space', () => {
    expect(appendQuickComment('Clear drawing.', 'See me in class.')).toBe('Clear drawing. See me in class.')
    expect(appendQuickComment('Clear drawing.  ', 'See me in class.')).toBe('Clear drawing. See me in class.')
  })

  it('a chip after a line break starts on that line', () => {
    expect(appendQuickComment('Clear drawing.\n', 'See me in class.')).toBe('Clear drawing.\nSee me in class.')
  })

  it('never goes past the feedback limit', () => {
    const long = 'a'.repeat(4995)
    expect(appendQuickComment(long, 'Check your spelling.', 5000)).toBe(long)
  })
})
