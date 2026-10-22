// services/types/profile.d.ts
// The signed-in person's avatar and photo (GET/PUT/POST/DELETE /api/profile).

export type AvatarStyle = 'short' | 'long' | 'hijab' | 'kufi' | 'beard' | 'curly'

/** An illustrated avatar. A person with no avatar (null) shows the neutral one. */
export interface AvatarSpec {
  style: AvatarStyle
  /** Index into the six skin tones (AVATAR_SKINS; light-to-dark order is AVATAR_SKIN_ORDER). */
  skin: 0 | 1 | 2 | 3 | 4 | 5
  /** Index into the eight background colors. */
  bg: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
}

/** Someone shown in a list: a classmate, a teacher, a guardian. */
export interface PersonLite {
  userId: string | null
  studentId?: string
  name: string
  avatar: AvatarSpec | null
  photoUrl?: string | null
}

export interface ProfileEnvelope<T> {
  status: 'success'
  data: T
}

/** GET /profile. `photosAllowed` is false for a student while the school has photos off. */
export interface ProfileData {
  avatar: AvatarSpec | null
  /** A signed URL, good for about six hours. */
  photoUrl: string | null
  photosAllowed: boolean
}

/** PUT /profile/avatar */
export interface ProfileAvatarResult {
  avatar: AvatarSpec | null
}

/** POST and DELETE /profile/photo */
export interface ProfilePhotoResult {
  photoUrl: string | null
}
