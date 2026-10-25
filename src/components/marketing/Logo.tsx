import Image from 'next/image'
import Link from 'next/link'
import { cx } from './ui'

/** The mule and the wordmark side by side, for the navbar and footer. */
export default function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="SchoolMule home"
      className={cx(
        'inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
        className,
      )}
    >
      <Image src="/marketing/mule-mark.png" alt="" width={48} height={36} sizes="48px" loading="eager" className="h-9 w-auto" />
      <span className="text-[1.2rem] font-semibold tracking-[-0.02em] text-leaders max-[379px]:sr-only">SchoolMule</span>
    </Link>
  )
}
