// src/components/classes/identity/ClassIcon.tsx
// A class's icon tile (one of the 13 subject icons). The icon art carries its
// own rounded tile, so this only sizes it.

import type { ClassIdentity } from '@/services/types/classroom'

interface ClassIconProps {
  identity: Pick<ClassIdentity, 'iconUrl'>
  /** Pixels, width and height. */
  size?: number
  className?: string
}

export default function ClassIcon({ identity, size = 40, className = '' }: ClassIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG from public/class-icons
    <img
      src={identity.iconUrl}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.27) }}
      className={`block shrink-0 ${className}`}
    />
  )
}
