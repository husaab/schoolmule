// src/lib/avatar.ts
// Avatars: an illustrated face (style, skin tone, background) drawn as inline
// SVG, the same artwork as the Photos board. The drawing data lives in
// avatarShapes.json; the backend keeps the same style list in utils/avatar.js
// and the pre-rendered email PNGs come from scripts/render-avatar-pngs.mjs.
//
// A person with no avatar (null, or anything invalid) shows the neutral one.

import shapesData from './avatarShapes.json'
import type { AvatarSpec, AvatarStyle } from '@/services/types/profile'

export type { AvatarSpec, AvatarStyle }

export interface AvatarShape {
  tag: string
  attrs: Record<string, string>
}

interface StyleData {
  id: AvatarStyle
  label: string
  shapes: AvatarShape[]
}

// JSON imports type arrays loosely (string[][]); the file's shape is fixed.
const data = shapesData as unknown as {
  skins: [string, string][]
  bgs: [string, string, string][]
  styles: StyleData[]
  neutral: AvatarShape[]
}

/** The styles in picker order. */
export const AVATAR_STYLES: { id: AvatarStyle; label: string }[] = data.styles.map(({ id, label }) => ({ id, label }))

/** Skin tones, light to dark; an avatar's `skin` is an index into this list. */
export const AVATAR_SKINS: { hex: string; label: string }[] = data.skins.map(([hex, label]) => ({ hex, label }))

/** Backgrounds; `ink` colors the shirt and the hijab scarf. An avatar's `bg` indexes this list. */
export const AVATAR_BGS: { bg: string; ink: string; label: string }[] = data.bgs.map(([bg, ink, label]) => ({
  bg,
  ink,
  label,
}))

/** Where the picker starts for someone with no avatar yet (the Photos board's default). */
export const DEFAULT_AVATAR: AvatarSpec = { style: 'short', skin: 1, bg: 1 }

const isIndex = (value: unknown, count: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < count

export function isAvatarSpec(value: unknown): value is AvatarSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const { style, skin, bg } = value as Record<string, unknown>
  return (
    typeof style === 'string' &&
    data.styles.some((s) => s.id === style) &&
    isIndex(skin, data.skins.length) &&
    isIndex(bg, data.bgs.length)
  )
}

/** The drawing for an avatar, placeholders filled in. Anything invalid draws the neutral avatar. */
export function resolveShapes(spec: AvatarSpec | null | undefined): AvatarShape[] {
  if (!isAvatarSpec(spec)) return data.neutral.map((s) => ({ tag: s.tag, attrs: { ...s.attrs } }))
  const style = data.styles.find((s) => s.id === spec.style)!
  const [bg, ink] = data.bgs[spec.bg]
  const fills: Record<string, string> = { '{bg}': bg, '{ink}': ink, '{skin}': data.skins[spec.skin][0] }
  return style.shapes.map((s) => ({
    tag: s.tag,
    attrs: Object.fromEntries(Object.entries(s.attrs).map(([name, value]) => [name, fills[value] ?? value])),
  }))
}

const attrString = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ')

/** A standalone 96x96 SVG document (for the email PNG script). */
export function avatarSvgString(spec: AvatarSpec | null | undefined): string {
  const body = resolveShapes(spec)
    .map((s) => `<${s.tag} ${attrString(s.attrs)}/>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">${body}</svg>`
}

/** SVG attribute names as React props (stroke-width becomes strokeWidth). */
export function reactAttrs(attrs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attrs).map(([name, value]) => [name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), value]),
  )
}
