import Image from 'next/image'
import { FOUNDER } from '@/lib/marketing/site'
import { cx } from './ui'

/** The founder's photo, or initials when there is none (lib/marketing/site FOUNDER.photo). */
function FounderPortrait() {
  const box = 'size-28 rounded-[1.75rem] text-3xl'
  if (FOUNDER.photo) {
    return (
      <Image
        src={FOUNDER.photo}
        alt={FOUNDER.name}
        width={112}
        height={112}
        sizes="112px"
        className={cx(box, 'shrink-0 bg-mist object-cover ring-1 ring-ink/[0.06]')}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={FOUNDER.name}
      className={cx(box, 'grid shrink-0 place-items-center bg-leaders font-semibold tracking-tight text-white')}
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
