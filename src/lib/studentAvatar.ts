// Everyone gets an avatar without anyone picking one: the hijab for a girl or
// woman, short hair for a boy or man, read from their first name
// (lib/nameGender), with a background drawn from the whole name. Students
// all get the light pink skin tone; adults get one of the original five,
// drawn from the name. Across a class it looks varied, but a person always gets the same
// one, on every page and every year (a new school year gives students new
// ids, not new names). A name that doesn't say either gets the neutral avatar
// rather than a guess. An avatar that was actually picked always wins. The
// Avatar component draws one for anybody shown without a pick: students,
// teachers and parents alike.

import { AVATAR_BGS, isAvatarSpec, type AvatarSpec } from './avatar'
import { nameGender } from './nameGender'

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

/** Every student's drawn skin tone: light pink (AVATAR_SKINS[5]). */
export const STUDENT_SKIN: AvatarSpec['skin'] = 5

// The tones an adult's name draws from: the original five, so adding a tone
// never repaints anyone.
const ADULT_SKIN_COUNT = 5

/** The avatar a name gives, or null (neutral) when the first name doesn't say girl or boy. */
export function drawnAvatar(name: string | null | undefined, { student = false }: { student?: boolean } = {}): AvatarSpec | null {
  const gender = nameGender(name)
  if (!gender) return null
  const h = hash((name ?? '').trim().toLowerCase().replace(/\s+/g, ' '))
  return {
    style: gender === 'female' ? 'hijab' : 'short',
    skin: student ? STUDENT_SKIN : ((Math.floor(h / 2) % ADULT_SKIN_COUNT) as AvatarSpec['skin']),
    bg: (Math.floor(h / 10) % AVATAR_BGS.length) as AvatarSpec['bg'],
  }
}

/** The avatar to show for a student: their picked one, else the one their name gives, else null (neutral). */
export function studentAvatar(student: { name: string | null; avatar?: unknown }): AvatarSpec | null {
  return isAvatarSpec(student.avatar) ? student.avatar : drawnAvatar(student.name, { student: true })
}
