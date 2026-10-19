// Everyone gets an avatar without anyone picking one: hijab or short hair,
// with a skin tone and a background, drawn from their name. Across a class it
// looks random, but a person always gets the same one, on every page and
// every year (a new school year gives students new ids, not new names). An
// avatar that was actually picked always wins. The Avatar component draws one
// for anybody shown without a pick (teachers, parents, students alike).

import { AVATAR_BGS, AVATAR_SKINS, isAvatarSpec, type AvatarSpec } from './avatar'

const STUDENT_STYLES = ['hijab', 'short'] as const

/** FNV-1a with a final mix, so similar names still land far apart. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** The avatar a name draws (case and spacing ignored). */
export function drawnAvatar(name: string | null | undefined): AvatarSpec {
  const h = hash((name ?? '').trim().toLowerCase().replace(/\s+/g, ' '))
  return {
    style: STUDENT_STYLES[h % STUDENT_STYLES.length],
    skin: (Math.floor(h / 2) % AVATAR_SKINS.length) as AvatarSpec['skin'],
    bg: (Math.floor(h / 10) % AVATAR_BGS.length) as AvatarSpec['bg'],
  }
}

/** The avatar to show for a student: their picked one, else the one their name draws. */
export function studentAvatar(student: { name: string | null; avatar?: unknown }): AvatarSpec {
  return isAvatarSpec(student.avatar) ? student.avatar : drawnAvatar(student.name)
}
