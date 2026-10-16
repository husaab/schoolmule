import { describe, expect, it } from 'vitest'
import {
  CLASS_COLORS,
  CLASS_COLOR_KEYS,
  CLASS_FAMILIES,
  FAMILY_DEFAULT_COLOR,
  FAMILY_LABELS,
  DEFAULT_DRAFT,
  defaultIdentity,
  draftOf,
  identityPatch,
  isDefaultDraft,
  pickBanner,
  pickColor,
  pickIcon,
  previewIdentity,
  subjectFamily,
  type ClassIdentity,
} from './classIdentity'

// The same spelling table as the backend test (utils/classIdentity.test.js),
// so the two maps cannot drift apart.

describe('subjectFamily', () => {
  const cases: [string, string][] = [
    ['Quran', 'quran'], ['Quran Teaching', 'quran'], ['Quran Teaching and Memorization', 'quran'],
    ['Arabic', 'arabic'],
    ['Islamic', 'islamic'], ['Islamic Studies', 'islamic'],
    ['French', 'french'], ['Français', 'french'], ['Francais', 'french'],
    ['Computer Science', 'computer'], ['Computer Studies', 'computer'], ['Coding', 'computer'],
    ['ICT', 'computer'], ['Technology', 'computer'],
    ['English', 'english'], ['English Language Arts', 'english'], ['Literacy', 'english'],
    ['Science', 'science'], ['Physics', 'science'], ['Chemistry', 'science'], ['Biology', 'science'],
    ['Math', 'math'], ['Mathematics', 'math'],
    ['Social Studies', 'social'], ['History', 'social'], ['Geography', 'social'],
    ['Physical Education', 'pe'], ['Physical Activities', 'pe'], ['Gym', 'pe'], ['P.E.', 'pe'], ['PE', 'pe'], ['Sports', 'pe'],
    ['Art', 'art'], ['Arts', 'art'], ['Visual Arts', 'art'], ['Drawing', 'art'],
    ['Junior Kindergarten', 'kindergarten'], ['Senior Kindergarten', 'kindergarten'],
    ['Loper', 'default'], ['Test', 'default'],
  ]
  it.each(cases)('maps %s to %s', (subject, family) => {
    expect(subjectFamily(subject, '5')).toBe(family)
  })

  it('matches case-insensitively and ignores padding', () => {
    expect(subjectFamily('  QURAN  ', '3')).toBe('quran')
    expect(subjectFamily('mAtH', 3)).toBe('math')
  })

  it('applies the rules in order, first match wins', () => {
    expect(subjectFamily('Islamic Studies and Quran', '4')).toBe('quran')
    expect(subjectFamily('Arabic and Islamic Studies', '4')).toBe('arabic')
    expect(subjectFamily('French Language Arts', '4')).toBe('french')
    expect(subjectFamily('Smart Start', '4')).toBe('default')
    expect(subjectFamily('Heart and Soul', '4')).toBe('default')
    expect(subjectFamily('Partners', '4')).toBe('default')
    expect(subjectFamily('Pet Care', '4')).toBe('default')
    expect(subjectFamily('Speech', '4')).toBe('default')
  })

  it('sends JK and SK classes with an unknown subject to kindergarten, others to default', () => {
    expect(subjectFamily('Homeroom', 'SK')).toBe('kindergarten')
    expect(subjectFamily('Homeroom', 'JK')).toBe('kindergarten')
    expect(subjectFamily('Homeroom', '1')).toBe('default')
    expect(subjectFamily('Homeroom', null)).toBe('default')
    expect(subjectFamily(null, undefined)).toBe('default')
    expect(subjectFamily('', 'SK')).toBe('kindergarten')
  })

  it('lets a subject keyword win over the kindergarten grade fallback', () => {
    expect(subjectFamily('Quran', 'JK')).toBe('quran')
    expect(subjectFamily('Math', 'SK')).toBe('math')
  })
})

describe('CLASS_COLORS', () => {
  it('has the 11 colors in picker order', () => {
    expect(CLASS_COLOR_KEYS).toEqual([
      'teal', 'blue', 'emerald', 'lime', 'yellow', 'orange', 'rose', 'pink', 'purple', 'sky', 'slate',
    ])
    expect(Object.keys(CLASS_COLORS)).toEqual([...CLASS_COLOR_KEYS])
  })

  it('carries the Tailwind 500 swatch hexes', () => {
    expect(Object.values(CLASS_COLORS).map((c) => c.hex)).toEqual([
      '#14b8a6', '#3b82f6', '#10b981', '#84cc16', '#eab308', '#f97316',
      '#f43f5e', '#ec4899', '#a855f7', '#0ea5e9', '#64748b',
    ])
  })

  it('spells every class out as a literal for the Tailwind scanner', () => {
    expect(CLASS_COLORS.teal).toEqual({
      label: 'Teal', hex: '#14b8a6',
      swatch: 'bg-teal-500', tint: 'bg-teal-100', ink: 'text-teal-800', border: 'border-teal-200', ring: 'ring-teal-500',
    })
    for (const [key, c] of Object.entries(CLASS_COLORS)) {
      expect(c.swatch).toBe(`bg-${key}-500`)
      expect(c.tint).toBe(`bg-${key}-100`)
      expect(c.ink).toBe(`text-${key}-800`)
      expect(c.border).toBe(`border-${key}-200`)
      expect(c.ring).toBe(`ring-${key}-500`)
      expect(c.label.toLowerCase()).toBe(key)
    }
  })
})

describe('families', () => {
  it('lists the 13 families, each with a label and a default color from the palette', () => {
    expect(CLASS_FAMILIES).toHaveLength(13)
    expect(new Set(CLASS_FAMILIES).size).toBe(13)
    expect(Object.keys(FAMILY_LABELS).sort()).toEqual([...CLASS_FAMILIES].sort())
    expect(Object.keys(FAMILY_DEFAULT_COLOR).sort()).toEqual([...CLASS_FAMILIES].sort())
    for (const color of Object.values(FAMILY_DEFAULT_COLOR)) expect(CLASS_COLOR_KEYS).toContain(color)
  })

  it('names them as the Banners board does', () => {
    expect(FAMILY_LABELS).toEqual({
      quran: 'Quran', arabic: 'Arabic', islamic: 'Islamic Studies', french: 'French', computer: 'Computer Studies',
      english: 'English', science: 'Science', math: 'Math', social: 'Social Studies', pe: 'Physical Education',
      art: 'Art', kindergarten: 'Kindergarten', default: 'Default',
    })
  })

  it('uses the same default colors as the backend', () => {
    expect(FAMILY_DEFAULT_COLOR).toEqual({
      quran: 'emerald', arabic: 'orange', islamic: 'pink', french: 'yellow', computer: 'slate',
      english: 'rose', science: 'teal', math: 'blue', social: 'sky', pe: 'lime', art: 'purple',
      kindergarten: 'sky', default: 'slate',
    })
  })
})

describe('defaultIdentity', () => {
  it('is the subject family banner, icon and color, all marked as defaults', () => {
    expect(defaultIdentity('Science', '5')).toEqual({
      family: 'science',
      bannerKey: 'science',
      bannerUrl: '/class-banners/science.svg',
      bannerIsUpload: false,
      iconKey: 'science',
      iconUrl: '/class-icons/science.svg',
      color: 'teal',
      isDefault: { banner: true, icon: true, color: true },
    })
  })

  it('follows a JK/SK class with no keyword to kindergarten', () => {
    expect(defaultIdentity('Homeroom', 'JK')).toMatchObject({ family: 'kindergarten', color: 'sky' })
  })
})

describe('identity drafts (the Change banner window)', () => {
  const science = defaultIdentity('Science', '5')
  const upload: ClassIdentity = {
    ...science,
    bannerKey: null,
    bannerUrl: 'https://cdn.example.com/school-assets/TEST/class-banners/c1/b.jpg',
    bannerIsUpload: true,
    isDefault: { banner: false, icon: true, color: true },
  }
  const picked: ClassIdentity = {
    ...science,
    bannerKey: 'math',
    bannerUrl: '/class-banners/math.svg',
    iconKey: 'art',
    iconUrl: '/class-icons/art.svg',
    color: 'purple',
    isDefault: { banner: false, icon: false, color: false },
  }

  it('reads what is saved: defaults as null, picks as keys, an upload as upload', () => {
    expect(draftOf(science)).toEqual({ banner: { kind: 'default' }, icon: null, color: null })
    expect(draftOf(picked)).toEqual({ banner: { kind: 'key', key: 'math' }, icon: 'art', color: 'purple' })
    expect(draftOf(upload)).toEqual({ banner: { kind: 'upload' }, icon: null, color: null })
  })

  it('previews a draft exactly as the server would resolve it', () => {
    expect(previewIdentity(science, draftOf(picked))).toEqual(picked)
    expect(previewIdentity(picked, DEFAULT_DRAFT)).toEqual(science)
    expect(previewIdentity(upload, draftOf(upload))).toEqual(upload)
  })

  it('treats picking the subject’s own banner, icon or color as the default', () => {
    let d = pickBanner(science, draftOf(picked), 'science')
    d = pickIcon(science, d, 'science')
    d = pickColor(science, d, 'teal')
    expect(d).toEqual(DEFAULT_DRAFT)
    expect(pickColor(science, DEFAULT_DRAFT, 'rose')).toEqual({ ...DEFAULT_DRAFT, color: 'rose' })
  })

  it('sends only what changed, null for a return to the default', () => {
    expect(identityPatch(science, draftOf(science))).toBeNull()
    expect(identityPatch(science, { ...DEFAULT_DRAFT, color: 'rose' })).toEqual({ color: 'rose' })
    expect(identityPatch(picked, DEFAULT_DRAFT)).toEqual({ bannerKey: null, iconKey: null, color: null })
    expect(identityPatch(picked, { ...draftOf(picked), banner: { kind: 'key', key: 'quran' } })).toEqual({ bannerKey: 'quran' })
  })

  it('leaves an upload alone unless another banner is chosen', () => {
    expect(identityPatch(upload, { ...draftOf(upload), icon: 'math' })).toEqual({ iconKey: 'math' })
    expect(identityPatch(upload, DEFAULT_DRAFT)).toEqual({ bannerKey: null })
    expect(identityPatch(upload, { ...DEFAULT_DRAFT, banner: { kind: 'key', key: 'art' } })).toEqual({ bannerKey: 'art' })
  })

  it('knows when the draft is all defaults', () => {
    expect(isDefaultDraft(DEFAULT_DRAFT)).toBe(true)
    expect(isDefaultDraft(draftOf(upload))).toBe(false)
    expect(isDefaultDraft({ ...DEFAULT_DRAFT, icon: 'pe' })).toBe(false)
  })
})
