// services/types/classroom.d.ts
// A class's look (banner, icon, color), its options and the teacher's
// classroom endpoints (/api/classroom/classes/:classId/...).

export type { AvatarSpec, AvatarStyle, PersonLite } from './profile'

export type ClassFamily =
  | 'quran' | 'arabic' | 'islamic' | 'french' | 'computer' | 'english' | 'science'
  | 'math' | 'social' | 'pe' | 'art' | 'kindergarten' | 'default'

export type ClassColor =
  | 'teal' | 'blue' | 'emerald' | 'lime' | 'yellow' | 'orange' | 'rose' | 'pink' | 'purple' | 'sky' | 'slate'

export interface ClassIdentity {
  family: ClassFamily
  /** null when an upload is in use. */
  bannerKey: ClassFamily | null
  /** '/class-banners/<key>.svg', or the public URL of the upload. */
  bannerUrl: string
  bannerIsUpload: boolean
  iconKey: ClassFamily
  /** '/class-icons/<key>.svg' */
  iconUrl: string
  color: ClassColor
  /** True for each part still on the subject default. */
  isDefault: { banner: boolean; icon: boolean; color: boolean }
}

/** PATCH identity: a field left out is untouched, a field set to null goes back to the default. */
export interface ClassIdentityPatch {
  bannerKey?: ClassFamily | null
  iconKey?: ClassFamily | null
  color?: ClassColor | null
}

export interface ClassOptions {
  acceptLate: boolean
  emailNewPosts: boolean
  showClassAverage: boolean
}

export interface ClassroomEnvelope<T> {
  status: 'success'
  data: T
}

export interface ClassIdentityResult {
  classId: string
  identity: ClassIdentity
}

export interface ClassOptionsResult {
  classId: string
  options: ClassOptions
}

export interface ClassArchiveResult {
  classId: string
  /** ISO time, or null after unarchiving. */
  archivedAt: string | null
}

export interface StudentAvatarResult {
  studentId: string
  avatar: import('./profile').AvatarSpec | null
}
