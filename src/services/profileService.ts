// src/services/profileService.ts
// The signed-in person's own avatar and photo (/api/profile). Every role may
// call these, students included; the server keys them on the token's user.

import apiClient from './apiClient'
import apiUpload from './apiUpload'
import type {
  AvatarSpec,
  ProfileAvatarResult,
  ProfileData,
  ProfileEnvelope,
  ProfilePhotoResult,
} from './types/profile'

/** GET /profile: avatar, a fresh signed photo URL, and whether photos are allowed. */
export const getProfile = () => apiClient<ProfileEnvelope<ProfileData>>('/profile')

/** PUT /profile/avatar: null goes back to the neutral avatar. */
export const saveAvatar = (avatar: AvatarSpec | null) =>
  apiClient<ProfileEnvelope<ProfileAvatarResult>, { avatar: AvatarSpec | null }>('/profile/avatar', {
    method: 'PUT',
    body: { avatar },
  })

/** POST /profile/photo (multipart "photo"; JPEG, PNG or WebP, 2 MB at most). */
export const uploadPhoto = (photo: Blob, fileName = 'photo.jpg') => {
  const form = new FormData()
  form.append('photo', photo, fileName)
  return apiUpload<ProfileEnvelope<ProfilePhotoResult>>('/profile/photo', form)
}

/** DELETE /profile/photo: back to the avatar. */
export const deletePhoto = () =>
  apiClient<ProfileEnvelope<ProfilePhotoResult>>('/profile/photo', { method: 'DELETE' })
