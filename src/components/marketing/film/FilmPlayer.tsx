'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { FILM } from '@/lib/marketing/site'
import { FILM_STATE, openFilm } from './filmEvents'
import { cx } from '../ui'

// A silent loop cut from the film, with "Watch with sound" opening the full
// film at the matching chapter.
//
// The poster is a real image (next/image), so it is the page's largest paint
// and nothing waits on video. The loop only starts loading once the page has
// loaded and the frame is on screen, never on Save-Data, and never for
// visitors who've asked for reduced motion (they keep the poster). It pauses
// off screen and while the full film is open.

interface FilmPlayerProps {
  /** Silent loop, plus an optional smaller cut for phones. */
  src: string
  srcSmall?: string
  poster: string
  /** Where "Watch with sound" starts the full film, in seconds. */
  startAt?: number
  /** Analytics label for where the film was opened from. */
  from: string
  priority?: boolean
  sizes?: string
  className?: string
  /** Pill text. */
  label?: string
  /** Shown after the label; the full film's length unless null. */
  length?: string | null
  /** Chapter frames carry a caption at the top, so their button sits at the bottom. */
  pillPosition?: 'top' | 'bottom'
}

function canAutoplay() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !conn?.saveData
}

export default function FilmPlayer({
  src,
  srcSmall,
  poster,
  startAt = 0,
  from,
  priority,
  sizes = '(min-width: 1200px) 1150px, 100vw',
  className,
  label = 'Watch with sound',
  length = FILM.length,
  pillPosition = 'top',
}: FilmPlayerProps) {
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [armed, setArmed] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [filmOpen, setFilmOpen] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    const onFilm = (e: Event) => setFilmOpen((e as CustomEvent<boolean>).detail)
    window.addEventListener(FILM_STATE, onFilm)
    return () => {
      io.disconnect()
      window.removeEventListener(FILM_STATE, onFilm)
    }
  }, [])

  // Attach the sources once the page has finished loading and the frame is
  // on screen, so loops further down the page cost nothing until reached.
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!canAutoplay()) return
    const ready = () => setLoaded(true)
    if (document.readyState === 'complete') {
      const t = window.setTimeout(ready, 300)
      return () => window.clearTimeout(t)
    }
    window.addEventListener('load', ready, { once: true })
    return () => window.removeEventListener('load', ready)
  }, [])
  if (loaded && onScreen && !armed) setArmed(true)

  useEffect(() => {
    const v = video.current
    if (!v || !armed) return
    // React doesn't reliably set the muted property, and only muted video may autoplay.
    v.muted = true
    if (onScreen && !filmOpen) void v.play().catch(() => {})
    else v.pause()
  }, [armed, onScreen, filmOpen])

  return (
    <div
      ref={frame}
      className={cx(
        'group relative aspect-video cursor-pointer overflow-hidden rounded-[1rem] bg-mist',
        className,
      )}
      onClick={() => openFilm(startAt, from)}
    >
      <Image
        src={poster}
        alt=""
        fill
        loading={priority ? 'eager' : undefined}
        fetchPriority={priority ? 'high' : undefined}
        sizes={sizes}
        className="object-cover"
      />
      {armed && (
        <video
          ref={video}
          className={cx(
            'absolute inset-0 size-full object-cover transition-opacity duration-500',
            playing ? 'opacity-100' : 'opacity-0',
          )}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
        >
          {srcSmall && <source src={srcSmall} type="video/mp4" media="(max-width: 767px)" />}
          <source src={src} type="video/mp4" />
        </video>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          openFilm(startAt, from)
        }}
        className={cx(
          'absolute right-3 inline-flex items-center gap-2.5 rounded-full bg-white/95 p-1.5 text-sm font-semibold text-ink shadow-[0_8px_24px_-12px_rgba(11,19,36,0.5)] ring-1 ring-ink/5 transition-[transform,box-shadow] duration-200 ease-film group-hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 active:scale-[0.97] sm:right-4 sm:pr-4 sm:text-base',
          pillPosition === 'top' ? 'top-3 sm:top-4' : 'bottom-3 sm:bottom-4',
        )}
      >
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-brand-ink text-white sm:size-8">
          <svg viewBox="0 0 10 12" className="ml-px size-3 fill-current">
            <path d="M0 0l10 6-10 6z" />
          </svg>
        </span>
        <span className="max-sm:sr-only">{label}</span>
        {length && <span className="font-medium text-slate-600 max-sm:hidden">{length}</span>}
      </button>
    </div>
  )
}
