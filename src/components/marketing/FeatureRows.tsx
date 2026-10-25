'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import Modal from '@/components/shared/modal'
import { ScreenFrame } from './frames'
import { trackEvent } from './film/filmEvents'
import { cx } from './ui'

// A list of features, each opening a closer look (its real screen and a few
// lines) in a modal instead of a new page.

export interface Feature {
  title: string
  summary: string
  detail: string[]
  src: string
  url: string
  alt: string
  who?: string
  /** Defaults to a 2400×1500 screen capture. */
  width?: number
  height?: number
  /** Report cards and other documents: no browser bar. */
  document?: boolean
}

export default function FeatureRows({ features, columns = 2 }: { features: Feature[]; columns?: 1 | 2 }) {
  const [open, setOpen] = useState<Feature | null>(null)

  return (
    <>
      <ul className={cx('grid gap-x-10 border-t border-hairline', columns === 2 && 'md:grid-cols-2')}>
        {features.map((f) => (
          <li key={f.title} className="border-b border-hairline">
            <button
              type="button"
              onClick={() => {
                setOpen(f)
                trackEvent('feature_open', { feature: f.title })
              }}
              className="group grid w-full grid-cols-[5.5rem_1fr_auto] items-center gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 sm:grid-cols-[7rem_1fr_auto] sm:gap-5"
            >
              <span className="relative block aspect-[8/5] overflow-hidden rounded-lg bg-mist ring-1 ring-ink/[0.06]">
                <Image src={f.src} alt="" fill sizes="112px" className="object-cover object-left-top" />
              </span>
              <span className="grid gap-0.5">
                <span className="font-semibold text-ink">{f.title}</span>
                <span className="text-[0.95rem] leading-snug text-slate-600">{f.summary}</span>
              </span>
              <ChevronRight
                aria-hidden
                strokeWidth={1.75}
                className="size-5 text-slate-400 transition-transform duration-200 ease-film group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={!!open}
        onClose={() => setOpen(null)}
        closeOnEscape
        ariaLabel={open?.title}
        style="w-[min(94vw,62rem)]"
        maxHeightClass="max-h-[92vh]"
      >
        {open && (
          <div className="mk grid gap-6 overflow-y-auto p-5 sm:p-8">
            <div className="grid gap-2 pr-10">
              {open.who && <p className="text-sm font-medium text-brand-ink">{open.who}</p>}
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">{open.title}</h2>
            </div>
            {open.document ? (
              <Image
                src={open.src}
                alt={open.alt}
                width={open.width ?? 1700}
                height={open.height ?? 2402}
                sizes="(min-width: 860px) 720px, 90vw"
                className="mx-auto block h-auto w-full max-w-[720px] rounded-md shadow-[0_20px_50px_-30px_rgba(11,19,36,0.5)] ring-1 ring-ink/[0.06]"
              />
            ) : (
              <ScreenFrame
                src={open.src}
                alt={open.alt}
                url={open.url}
                width={open.width}
                height={open.height}
                sizes="(min-width: 1000px) 940px, 94vw"
              />
            )}
            <div className="grid gap-3 text-slate-600 sm:grid-cols-2 sm:gap-6">
              {open.detail.map((d) => (
                <p key={d} className="leading-relaxed">
                  {d}
                </p>
              ))}
            </div>
            <p className="text-xs text-slate-600">Demo school with sample data</p>
          </div>
        )}
      </Modal>
    </>
  )
}
