// src/lib/classIdentity.ts
// A class's look: banner, icon and color. The subject-to-family rules mirror
// the backend (utils/classIdentity.js) and share its test table, so a class
// the server skins as Science is Science here too. Every Tailwind class below
// is a full literal so the build can see it; never assemble them.

import type { ClassColor, ClassFamily, ClassIdentity, ClassIdentityPatch } from '@/services/types/classroom'

export type { ClassColor, ClassFamily, ClassIdentity, ClassIdentityPatch }

/** The 13 families in the order the Banners board lists them (also the picker order). */
export const CLASS_FAMILIES: readonly ClassFamily[] = [
  'quran', 'arabic', 'french', 'english', 'science', 'math', 'islamic',
  'social', 'computer', 'pe', 'art', 'kindergarten', 'default',
]

export const FAMILY_LABELS: Record<ClassFamily, string> = {
  quran: 'Quran',
  arabic: 'Arabic',
  islamic: 'Islamic Studies',
  french: 'French',
  computer: 'Computer Studies',
  english: 'English',
  science: 'Science',
  math: 'Math',
  social: 'Social Studies',
  pe: 'Physical Education',
  art: 'Art',
  kindergarten: 'Kindergarten',
  default: 'Default',
}

export const FAMILY_DEFAULT_COLOR: Record<ClassFamily, ClassColor> = {
  quran: 'emerald', arabic: 'orange', islamic: 'pink', french: 'yellow', computer: 'slate',
  english: 'rose', science: 'teal', math: 'blue', social: 'sky', pe: 'lime', art: 'purple',
  kindergarten: 'sky', default: 'slate',
}

/** The 11 colors in picker order. */
export const CLASS_COLOR_KEYS: readonly ClassColor[] = [
  'teal', 'blue', 'emerald', 'lime', 'yellow', 'orange', 'rose', 'pink', 'purple', 'sky', 'slate',
]

export interface ClassColorStyle {
  label: string
  /** The Tailwind 500 swatch color. */
  hex: string
  swatch: string
  /** Card and header tint (the 100 shade). */
  tint: string
  /** Text on the tint (the 800 shade). */
  ink: string
  border: string
  ring: string
}

export const CLASS_COLORS: Record<ClassColor, ClassColorStyle> = {
  teal: { label: 'Teal', hex: '#14b8a6', swatch: 'bg-teal-500', tint: 'bg-teal-100', ink: 'text-teal-800', border: 'border-teal-200', ring: 'ring-teal-500' },
  blue: { label: 'Blue', hex: '#3b82f6', swatch: 'bg-blue-500', tint: 'bg-blue-100', ink: 'text-blue-800', border: 'border-blue-200', ring: 'ring-blue-500' },
  emerald: { label: 'Emerald', hex: '#10b981', swatch: 'bg-emerald-500', tint: 'bg-emerald-100', ink: 'text-emerald-800', border: 'border-emerald-200', ring: 'ring-emerald-500' },
  lime: { label: 'Lime', hex: '#84cc16', swatch: 'bg-lime-500', tint: 'bg-lime-100', ink: 'text-lime-800', border: 'border-lime-200', ring: 'ring-lime-500' },
  yellow: { label: 'Yellow', hex: '#eab308', swatch: 'bg-yellow-500', tint: 'bg-yellow-100', ink: 'text-yellow-800', border: 'border-yellow-200', ring: 'ring-yellow-500' },
  orange: { label: 'Orange', hex: '#f97316', swatch: 'bg-orange-500', tint: 'bg-orange-100', ink: 'text-orange-800', border: 'border-orange-200', ring: 'ring-orange-500' },
  rose: { label: 'Rose', hex: '#f43f5e', swatch: 'bg-rose-500', tint: 'bg-rose-100', ink: 'text-rose-800', border: 'border-rose-200', ring: 'ring-rose-500' },
  pink: { label: 'Pink', hex: '#ec4899', swatch: 'bg-pink-500', tint: 'bg-pink-100', ink: 'text-pink-800', border: 'border-pink-200', ring: 'ring-pink-500' },
  purple: { label: 'Purple', hex: '#a855f7', swatch: 'bg-purple-500', tint: 'bg-purple-100', ink: 'text-purple-800', border: 'border-purple-200', ring: 'ring-purple-500' },
  sky: { label: 'Sky', hex: '#0ea5e9', swatch: 'bg-sky-500', tint: 'bg-sky-100', ink: 'text-sky-800', border: 'border-sky-200', ring: 'ring-sky-500' },
  slate: { label: 'Slate', hex: '#64748b', swatch: 'bg-slate-500', tint: 'bg-slate-100', ink: 'text-slate-800', border: 'border-slate-200', ring: 'ring-slate-500' },
}

// Evaluated in this order on the lower-cased subject; the first match wins.
// The word boundaries keep "art" and "pe" out of words like "Smart" and "Speech".
const RULES: [ClassFamily, RegExp][] = [
  ['quran', /quran/],
  ['arabic', /arabic/],
  ['islamic', /islam/],
  ['french', /french|fran[cç]ais/],
  ['computer', /computer|coding|\bict\b|technology/],
  ['english', /english|language arts|literacy/],
  ['science', /science|physics|chemistry|biology/],
  ['math', /math/],
  ['social', /social|history|geography/],
  ['pe', /physical|\bgym\b|\bp\.?e\.?\b|sport/],
  ['art', /\barts?\b|drawing|visual/],
  ['kindergarten', /kindergarten/],
]

/** The family a subject belongs to; a JK/SK class with no keyword is kindergarten. */
export function subjectFamily(subject: string | null | undefined, grade?: string | number | null): ClassFamily {
  const s = String(subject ?? '').toLowerCase()
  const hit = RULES.find(([, re]) => re.test(s))
  if (hit) return hit[0]
  const g = grade == null ? null : String(grade)
  return g === 'JK' || g === 'SK' ? 'kindergarten' : 'default'
}

/**
 * What a class looks like with nothing picked: its subject's banner, icon and
 * color. The server sends the real identity; this covers a row that arrives
 * without one (an older payload, a class not loaded yet).
 */
export function defaultIdentity(subject: string | null | undefined, grade?: string | number | null): ClassIdentity {
  const family = subjectFamily(subject, grade)
  return {
    family,
    bannerKey: family,
    bannerUrl: `/class-banners/${family}.svg`,
    bannerIsUpload: false,
    iconKey: family,
    iconUrl: `/class-icons/${family}.svg`,
    color: FAMILY_DEFAULT_COLOR[family],
    isDefault: { banner: true, icon: true, color: true },
  }
}

// ---------------------------------------------------------------------------
// The Change banner window works on a draft: what the teacher has picked, with
// null meaning "the subject default" exactly as the server stores it. Picking
// the subject's own banner, icon or color is the default, so a later rename
// of the subject still re-skins the class.

export type BannerChoice = { kind: 'default' } | { kind: 'key'; key: ClassFamily } | { kind: 'upload' }

export interface IdentityDraft {
  banner: BannerChoice
  icon: ClassFamily | null
  color: ClassColor | null
}

export const DEFAULT_DRAFT: IdentityDraft = { banner: { kind: 'default' }, icon: null, color: null }

/** The draft for what the server has saved. */
export function draftOf(identity: ClassIdentity): IdentityDraft {
  const banner: BannerChoice = identity.bannerIsUpload
    ? { kind: 'upload' }
    : identity.isDefault.banner || !identity.bannerKey
      ? { kind: 'default' }
      : { kind: 'key', key: identity.bannerKey }
  return {
    banner,
    icon: identity.isDefault.icon ? null : identity.iconKey,
    color: identity.isDefault.color ? null : identity.color,
  }
}

export const isDefaultDraft = (draft: IdentityDraft): boolean =>
  draft.banner.kind === 'default' && draft.icon === null && draft.color === null

export const pickBanner = (base: ClassIdentity, draft: IdentityDraft, key: ClassFamily): IdentityDraft => ({
  ...draft,
  banner: key === base.family ? { kind: 'default' } : { kind: 'key', key },
})

export const pickIcon = (base: ClassIdentity, draft: IdentityDraft, key: ClassFamily): IdentityDraft => ({
  ...draft,
  icon: key === base.family ? null : key,
})

export const pickColor = (base: ClassIdentity, draft: IdentityDraft, color: ClassColor): IdentityDraft => ({
  ...draft,
  color: color === FAMILY_DEFAULT_COLOR[base.family] ? null : color,
})

/**
 * How the class will look once the draft is saved, resolved the way the
 * server does. `base` is the saved identity (it holds an upload's URL).
 */
export function previewIdentity(base: ClassIdentity, draft: IdentityDraft): ClassIdentity {
  const family = base.family
  const useUpload = draft.banner.kind === 'upload' && base.bannerIsUpload
  const bannerKey: ClassFamily | null = useUpload ? null : draft.banner.kind === 'key' ? draft.banner.key : family
  const iconKey = draft.icon ?? family
  return {
    family,
    bannerKey,
    bannerUrl: useUpload ? base.bannerUrl : `/class-banners/${bannerKey}.svg`,
    bannerIsUpload: useUpload,
    iconKey,
    iconUrl: `/class-icons/${iconKey}.svg`,
    color: draft.color ?? FAMILY_DEFAULT_COLOR[family],
    isDefault: { banner: !useUpload && draft.banner.kind === 'default', icon: draft.icon === null, color: draft.color === null },
  }
}

/**
 * The one PATCH that turns the saved identity into the draft, or null when
 * nothing changed. An upload is never re-sent: it was saved when picked, and
 * any bannerKey (null included) would replace it.
 */
export function identityPatch(base: ClassIdentity, draft: IdentityDraft): ClassIdentityPatch | null {
  const saved = draftOf(base)
  const patch: ClassIdentityPatch = {}
  const sameBanner =
    saved.banner.kind === draft.banner.kind &&
    (draft.banner.kind !== 'key' || (saved.banner.kind === 'key' && saved.banner.key === draft.banner.key))
  if (!sameBanner && draft.banner.kind !== 'upload') {
    patch.bannerKey = draft.banner.kind === 'key' ? draft.banner.key : null
  }
  if (saved.icon !== draft.icon) patch.iconKey = draft.icon
  if (saved.color !== draft.color) patch.color = draft.color
  return Object.keys(patch).length > 0 ? patch : null
}
