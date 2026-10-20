'use client'

// A child's avatar on parent pages. Most parent payloads carry only the
// child's id and name, so the avatar comes from the linked-children list
// (the student's own pick, else the one a teacher set); neutral until known.

import Avatar from '@/components/avatar/Avatar'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import type { AvatarSpec } from '@/services/types/profile'

interface ChildAvatarProps {
  studentId: string
  name: string
  /** When the payload already carries the avatar; otherwise it is looked up. */
  avatar?: AvatarSpec | null
  size?: number
  className?: string
}

export default function ChildAvatar({ studentId, name, avatar, size, className }: ChildAvatarProps) {
  const listed = useSelectedChildStore((s) => s.children.find((c) => c.studentId === studentId))
  return <Avatar name={name} avatar={avatar ?? listed?.avatar ?? null} photoUrl={listed?.photoUrl} size={size} className={className} />
}
