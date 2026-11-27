'use client'
// Muley's face: the SchoolMule mule in its graduation cap (public/logo/muley.png).
import Image from 'next/image'

export default function MuleyAvatar({ size = 28, framed = true, className = '' }: { size?: number; framed?: boolean; className?: string }) {
  const image = <Image src={size > 96 ? '/logo/muley.png' : '/logo/muley-128.png'} alt="" width={size} height={size} className="select-none" draggable={false} />
  if (!framed) return <span className={`inline-flex shrink-0 ${className}`} aria-hidden="true">{image}</span>
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white ${className}`}
      style={{ width: size + 8, height: size + 8 }}
    >
      {image}
    </span>
  )
}
