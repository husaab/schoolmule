import Image from 'next/image'
import type { ReactNode } from 'react'
import { cx } from './ui'

// Product screenshots sit in a tray (the outer bezel) with the screen inside,
// like a pane set into a frame. Every screen is the synthetic demo school.

interface ScreenFrameProps {
  src: string
  alt: string
  /** The address shown in the bar, e.g. "schoolmule.ca/dashboard". */
  url?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  className?: string
  imageClassName?: string
  children?: ReactNode
}

export function BrowserBar({ url }: { url?: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-hairline bg-[#fbfcfd] px-3 py-2">
      <span className="size-2 rounded-full bg-slate-200" />
      <span className="size-2 rounded-full bg-slate-200" />
      <span className="size-2 rounded-full bg-slate-200" />
      {url && (
        <span className="mx-auto max-w-[60%] truncate rounded-md bg-slate-100 px-3 py-0.5 text-[11px] text-slate-600">{url}</span>
      )}
    </div>
  )
}

export function Tray({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-[1.375rem] bg-ink/[0.035] p-1.5 ring-1 ring-ink/[0.06]', className)}>
      <div className="overflow-hidden rounded-[1rem] bg-white shadow-[0_1px_2px_rgba(11,19,36,0.06),0_28px_56px_-28px_rgba(11,59,82,0.38)]">
        {children}
      </div>
    </div>
  )
}

export function ScreenFrame({
  src,
  alt,
  url,
  width = 2400,
  height = 1500,
  priority,
  sizes = '(min-width: 1200px) 1100px, 100vw',
  className,
  imageClassName,
  children,
}: ScreenFrameProps) {
  return (
    <Tray className={className}>
      <BrowserBar url={url} />
      <div className="relative">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : undefined}
          fetchPriority={priority ? 'high' : undefined}
          sizes={sizes}
          className={cx('block h-auto w-full', imageClassName)}
        />
        {children}
      </div>
    </Tray>
  )
}

export function PhoneFrame({
  src,
  alt,
  priority,
  className,
  sizes = '280px',
}: {
  src: string
  alt: string
  priority?: boolean
  className?: string
  sizes?: string
}) {
  return (
    <div
      className={cx(
        'w-[min(17.5rem,72vw)] rounded-[2.6rem] bg-ink p-2 shadow-[0_2px_4px_rgba(11,19,36,0.2),0_40px_70px_-30px_rgba(11,19,36,0.55)]',
        className,
      )}
    >
      <div className="overflow-hidden rounded-[2.1rem] bg-white">
        <Image
          src={src}
          alt={alt}
          width={1170}
          height={2532}
          loading={priority ? 'eager' : undefined}
          fetchPriority={priority ? 'high' : undefined}
          sizes={sizes}
          className="block h-auto w-full"
        />
      </div>
    </div>
  )
}

/** Small caption under product imagery, so nobody mistakes the demo school for a real one. */
export function SampleData({ className }: { className?: string }) {
  return <p className={cx('text-xs text-slate-600', className)}>Demo school with sample data</p>
}
