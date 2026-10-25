import Image from 'next/image'
import { FOUNDER } from '@/lib/marketing/site'
import { cx } from './ui'

/** The founder's photo, or his initials until a photo is supplied (lib/marketing/site FOUNDER.photo). */
export function FounderPortrait({ size = 'lg', className }: { size?: 'sm' | 'lg'; className?: string }) {
  const box = size === 'lg' ? 'size-28 rounded-[1.75rem] text-3xl' : 'size-11 rounded-full text-base'
  const photo = size === 'lg' ? FOUNDER.photo : FOUNDER.photoSmall
  if (photo) {
    return (
      <Image
        src={photo}
        alt={FOUNDER.name}
        width={size === 'lg' ? 112 : 44}
        height={size === 'lg' ? 112 : 44}
        sizes={size === 'lg' ? '112px' : '44px'}
        className={cx(box, 'shrink-0 bg-mist object-cover ring-1 ring-ink/[0.06]', className)}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={FOUNDER.name}
      className={cx(box, 'grid shrink-0 place-items-center bg-leaders font-semibold tracking-tight text-white', className)}
    >
      {FOUNDER.name
        .split(' ')
        .map((w) => w[0])
        .join('')}
    </span>
  )
}

export default function FounderNote({ quote, className }: { quote: string; className?: string }) {
  return (
    <figure className={cx('grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start', className)}>
      <FounderPortrait />
      <div className="grid gap-5">
        <blockquote className="text-balance text-[1.55rem] font-medium leading-[1.3] tracking-[-0.02em] text-ink sm:text-[1.9rem]">
          {quote}
        </blockquote>
        <figcaption className="text-slate-600">
          <span className="font-semibold text-ink">{FOUNDER.name}</span>, founder of SchoolMule
        </figcaption>
      </div>
    </figure>
  )
}
