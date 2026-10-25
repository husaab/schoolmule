import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

// Building blocks for the marketing pages. Server components; anything that
// needs state lives in its own client file.

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

type SectionProps = { id?: string; tone?: 'white' | 'mist'; className?: string; children: ReactNode; labelledBy?: string }

export function Section({ id, tone = 'white', className, children, labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx('py-20 sm:py-28 lg:py-32', tone === 'mist' && 'bg-mist', className)}
    >
      {children}
    </section>
  )
}

/** The small badge above a page's H1 that says who the page is for. */
export function Pill({ children, dot = 'bg-brand' }: { children: ReactNode; dot?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-leaders ring-1 ring-brand/20 shadow-[0_1px_2px_rgba(11,19,36,0.04)]">
      <span aria-hidden className={cx('size-2 rounded-full', dot)} />
      {children}
    </span>
  )
}

/** Serif italic accent for one phrase of a page heading. */
export function Accent({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('mk-accent', className)}>{children}</span>
}

export function H1({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h1
      id={id}
      className={cx(
        'text-balance text-[2.55rem] font-semibold leading-[1.03] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.4rem]',
        className,
      )}
    >
      {children}
    </h1>
  )
}

export function H2({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2
      id={id}
      className={cx('text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[2.6rem]', className)}
    >
      {children}
    </h2>
  )
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl', className)}>{children}</p>
}

const buttonBase =
  'group inline-flex min-h-12 items-center justify-center gap-3 rounded-full text-base font-semibold transition-[background-color,box-shadow,transform] duration-200 ease-film active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35'

export const buttonStyles = {
  primary: cx(
    buttonBase,
    'bg-brand-ink py-1.5 pl-6 pr-1.5 text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_24px_-12px_rgba(14,116,144,0.8)] hover:bg-brand-deep',
  ),
  secondary: cx(
    buttonBase,
    'bg-white py-1.5 pl-1.5 pr-5 text-ink ring-1 ring-hairline shadow-[0_1px_2px_rgba(11,19,36,0.05)] hover:ring-slate-300',
  ),
}

/** The trailing arrow sits in its own circle inside the button. */
export function ArrowDisc({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid size-9 place-items-center rounded-full transition-transform duration-200 ease-film group-hover:translate-x-0.5',
        tone === 'light' ? 'bg-white/15' : 'bg-ink/[0.05]',
      )}
    >
      <ArrowRight className="size-4" strokeWidth={1.75} />
    </span>
  )
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  ...rest
}: { href: string; children: ReactNode; variant?: 'primary' | 'secondary'; className?: string } & Omit<ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={cx(buttonStyles[variant], className)} {...rest}>
      {children}
      {variant === 'primary' && <ArrowDisc />}
    </Link>
  )
}

/** A quiet text link with an arrow that moves on hover. */
export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cx(
        'group inline-flex items-center gap-1.5 font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 rounded-sm',
        className,
      )}
    >
      {children}
      <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.75} />
    </Link>
  )
}

export { cx }
