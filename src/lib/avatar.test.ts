import { describe, expect, it } from 'vitest'
import {
  AVATAR_BGS,
  AVATAR_SKINS,
  AVATAR_STYLES,
  DEFAULT_AVATAR,
  avatarSvgString,
  isAvatarSpec,
  reactAttrs,
  resolveShapes,
  type AvatarSpec,
} from './avatar'

// The artwork is the Photos board's, verbatim (plan section 0.5). The backend
// keeps the same style list in utils/avatar.js and validates against it.

const STYLE_IDS = ['short', 'long', 'hijab', 'kufi', 'beard', 'curly'] as const
const SKINS = [0, 1, 2, 3, 4] as const
const BGS = [0, 1, 2, 3, 4, 5, 6, 7] as const
const allSpecs: AvatarSpec[] = STYLE_IDS.flatMap((style) =>
  SKINS.flatMap((skin) => BGS.map((bg) => ({ style, skin, bg }))),
)

const NEUTRAL_FILLS = ['#f1f5f9', '#cbd5e1', '#e2e8f0', '#e2e8f0']

describe('avatar constants', () => {
  it('lists the six styles in picker order with their labels', () => {
    expect(AVATAR_STYLES).toEqual([
      { id: 'short', label: 'Short hair' },
      { id: 'long', label: 'Long hair' },
      { id: 'hijab', label: 'Hijab' },
      { id: 'kufi', label: 'Kufi' },
      { id: 'beard', label: 'Beard' },
      { id: 'curly', label: 'Curly' },
    ])
  })

  it('lists five skin tones and eight backgrounds', () => {
    expect(AVATAR_SKINS.map((s) => s.hex)).toEqual(['#f1c9a5', '#d9a77c', '#b5835a', '#8d5a3b', '#6b4226'])
    expect(AVATAR_SKINS.map((s) => s.label)).toEqual(['Light', 'Medium light', 'Medium', 'Medium dark', 'Dark'])
    expect(AVATAR_BGS.map((b) => b.label)).toEqual(['Mint', 'Blue', 'Pink', 'Sun', 'Lime', 'Indigo', 'Peach', 'Slate'])
    expect(AVATAR_BGS[0]).toEqual({ bg: '#ccfbf1', ink: '#0f766e', label: 'Mint' })
    expect(AVATAR_BGS[7]).toEqual({ bg: '#e2e8f0', ink: '#334155', label: 'Slate' })
  })

  it('starts the picker on the board default (short, medium light, blue)', () => {
    expect(DEFAULT_AVATAR).toEqual({ style: 'short', skin: 1, bg: 1 })
  })
})

describe('resolveShapes', () => {
  it('gives every style at least three shapes with no placeholder left, for every skin and background', () => {
    for (const spec of allSpecs) {
      const shapes = resolveShapes(spec)
      expect(shapes.length).toBeGreaterThanOrEqual(3)
      for (const shape of shapes) {
        for (const value of Object.values(shape.attrs)) expect(value).not.toContain('{')
      }
    }
  })

  it('starts every style with the background and the shirt in the background ink', () => {
    for (const style of STYLE_IDS) {
      const [bg, shirt] = resolveShapes({ style, skin: 2, bg: 3 })
      expect(bg).toEqual({ tag: 'rect', attrs: { width: '96', height: '96', fill: '#fef3c7' } })
      expect(shirt.tag).toBe('path')
      expect(shirt.attrs).toEqual({ d: 'M14 96C16 74 32 66 48 66s32 8 34 30z', fill: '#b45309' })
    }
  })

  it('fills the face with the chosen skin tone', () => {
    const face = resolveShapes({ style: 'short', skin: 3, bg: 0 }).find((s) => s.tag === 'ellipse')
    expect(face?.attrs.fill).toBe('#8d5a3b')
  })

  it('draws the hijab scarf in the background ink', () => {
    const shapes = resolveShapes({ style: 'hijab', skin: 0, bg: 5 })
    expect(shapes.filter((s) => s.attrs.fill === '#4338ca')).toHaveLength(2) // shirt + scarf
    expect(shapes.find((s) => s.tag === 'ellipse')?.attrs.fill).toBe('#f1c9a5')
  })

  it('gives the kufi a white cap and no hair', () => {
    const shapes = resolveShapes({ style: 'kufi', skin: 1, bg: 1 })
    expect(shapes.some((s) => s.attrs.fill === '#ffffff')).toBe(true)
    expect(shapes.some((s) => s.attrs.fill === '#2b211c')).toBe(false)
  })

  it('adds the beard on top of the short-hair avatar', () => {
    const short = resolveShapes({ style: 'short', skin: 1, bg: 1 })
    const beard = resolveShapes({ style: 'beard', skin: 1, bg: 1 })
    expect(beard.slice(0, short.length)).toEqual(short)
    expect(beard).toHaveLength(short.length + 1)
  })

  it('builds the curly hair from six circles', () => {
    expect(resolveShapes({ style: 'curly', skin: 1, bg: 1 }).filter((s) => s.tag === 'circle')).toHaveLength(6)
  })

  it('shows the neutral avatar for no avatar', () => {
    for (const none of [null, undefined]) {
      const shapes = resolveShapes(none)
      expect(shapes.map((s) => s.attrs.fill)).toEqual(NEUTRAL_FILLS)
    }
  })

  it('shows the neutral avatar for anything that is not a valid avatar', () => {
    const bad = [
      { style: 'mohawk', skin: 0, bg: 0 },
      { style: 'short', skin: 5, bg: 0 },
      { style: 'short', skin: 0, bg: 8 },
      { style: 'short', skin: -1, bg: 0 },
      { style: 'short', skin: 1.5, bg: 0 },
      { style: 'short', skin: '1', bg: 0 },
      { style: 'short' },
      'short',
      42,
      [],
    ]
    for (const spec of bad) {
      expect(resolveShapes(spec as never).map((s) => s.attrs.fill)).toEqual(NEUTRAL_FILLS)
    }
  })

  it('does not change the artwork data when it substitutes', () => {
    const before = JSON.stringify(resolveShapes({ style: 'long', skin: 0, bg: 0 }))
    resolveShapes({ style: 'long', skin: 4, bg: 7 })
    expect(JSON.stringify(resolveShapes({ style: 'long', skin: 0, bg: 0 }))).toBe(before)
  })
})

describe('isAvatarSpec', () => {
  it('accepts exactly the valid values', () => {
    expect(isAvatarSpec({ style: 'curly', skin: 4, bg: 7 })).toBe(true)
    expect(isAvatarSpec({ style: 'curly', skin: 0, bg: 0 })).toBe(true)
    expect(isAvatarSpec({ style: 'curly', skin: 5, bg: 0 })).toBe(false)
    expect(isAvatarSpec({ style: 'bald', skin: 0, bg: 0 })).toBe(false)
    expect(isAvatarSpec(null)).toBe(false)
    expect(isAvatarSpec(undefined)).toBe(false)
    expect(isAvatarSpec('short')).toBe(false)
  })
})

describe('avatarSvgString', () => {
  it('is a 96x96 svg document that carries the skin tone', () => {
    const svg = avatarSvgString({ style: 'short', skin: 2, bg: 4 })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="0 0 96 96"')
    expect(svg).toContain('width="96"')
    expect(svg).toContain('#b5835a')
    expect(svg).toContain('#ecfccb')
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).not.toContain('{')
  })

  it('renders the neutral avatar for null', () => {
    const svg = avatarSvgString(null)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('#f1f5f9')
  })

  it('differs for every one of the 240 avatars', () => {
    expect(new Set(allSpecs.map((s) => avatarSvgString(s))).size).toBe(240)
  })
})

describe('reactAttrs', () => {
  it('turns svg attribute names into react props', () => {
    expect(reactAttrs({ fill: '#fff', stroke: '#cbd5e1', 'stroke-width': '1.5', cx: '34' })).toEqual({
      fill: '#fff',
      stroke: '#cbd5e1',
      strokeWidth: '1.5',
      cx: '34',
    })
  })
})
