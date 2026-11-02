'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/shared/modal'
import { CHAPTERS, DEMO_MINUTES, FILM, formatTime } from '@/lib/marketing/site'
import { WATCH_FILM_PARAM } from '@/lib/websiteVisit'
import { announceFilmState, openFilm, OPEN_FILM, trackEvent, type OpenFilmDetail } from './filmEvents'
import { ArrowDisc, buttonStyles } from '../ui'

// The full film with sound, in one modal for the whole site. It opens at the
// chapter it was asked for, lists the chapters, and ends on "Book a demo".
// A link to any website page with ?watch opens it as the page loads.
const CHAPTER_LIST = CHAPTERS.filter((c) => c.key !== 'reply' && c.key !== 'phones')

export default function FilmModalHost() {
  const [open, setOpen] = useState(false)
  const [ended, setEnded] = useState(false)
  // The browser refused to start the film with sound (no click opened it).
  const [blocked, setBlocked] = useState(false)
  const [current, setCurrent] = useState(0)
  const start = useRef(0)
  const video = useRef<HTMLVideoElement>(null)
  const reported = useRef(false)

  useEffect(() => {
    const onOpen = (e: Event) => {
      const { start: at, from } = (e as CustomEvent<OpenFilmDetail>).detail
      start.current = at
      reported.current = false
      setEnded(false)
      setBlocked(false)
      setOpen(true)
      trackEvent('film_open', { from, start: at })
    }
    window.addEventListener(OPEN_FILM, onOpen)
    if (new URLSearchParams(window.location.search).has(WATCH_FILM_PARAM)) openFilm(0, 'watch-link')
    return () => window.removeEventListener(OPEN_FILM, onOpen)
  }, [])

  useEffect(() => {
    announceFilmState(open)
  }, [open])

  const seek = (t: number) => {
    const v = video.current
    if (!v) return
    v.currentTime = t
    setEnded(false)
    void v.play().catch(() => {})
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      closeOnEscape
      ariaLabel="SchoolMule tour"
      style="w-[min(94vw,150vh)]"
      maxHeightClass="max-h-[94vh]"
    >
      <div className="mk relative bg-mist">
        {open && (
          <video
            ref={video}
            className="block aspect-video w-full bg-mist"
            autoPlay
            controls
            playsInline
            controlsList="nodownload noplaybackrate"
            poster={FILM.poster}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget
              if (start.current > 0) v.currentTime = start.current
              void v.play().catch((err: unknown) => {
                if (err instanceof DOMException && err.name === 'NotAllowedError') setBlocked(true)
              })
            }}
            onPlay={() => setBlocked(false)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onEnded={() => {
              setEnded(true)
              if (!reported.current) {
                reported.current = true
                trackEvent('film_complete')
              }
            }}
          >
            <source src={FILM.src720} type="video/mp4" media="(max-width: 767px)" />
            <source src={FILM.src1080} type="video/mp4" />
          </video>
        )}
        {blocked && (
          <button
            type="button"
            onClick={() => void video.current?.play().catch(() => {})}
            className="group absolute inset-0 grid place-items-center focus-visible:outline-none"
          >
            <span className="inline-flex items-center gap-3 rounded-full bg-white/95 p-2 pr-6 text-base font-semibold text-ink shadow-[0_8px_24px_-12px_rgba(11,19,36,0.5)] ring-1 ring-ink/5 transition-transform duration-200 ease-film group-hover:-translate-y-0.5 group-focus-visible:ring-4 group-focus-visible:ring-brand/40 group-active:scale-[0.97] sm:text-lg">
              <span aria-hidden className="grid size-10 place-items-center rounded-full bg-brand-ink text-white sm:size-12">
                <svg viewBox="0 0 10 12" className="ml-0.5 size-4 fill-current">
                  <path d="M0 0l10 6-10 6z" />
                </svg>
              </span>
              Play the tour
              <span className="font-medium text-slate-600">{FILM.length}</span>
            </span>
          </button>
        )}
        {ended && (
          <div className="absolute inset-0 grid place-items-center bg-white/90 backdrop-blur-sm">
            <div className="grid justify-items-center gap-4 px-6 text-center">
              <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">See it with your own school in mind.</p>
              <p className="text-slate-600">A {DEMO_MINUTES}-minute call with the person who builds SchoolMule.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/demo" className={buttonStyles.primary} onClick={() => setOpen(false)}>
                  Book a demo
                  <ArrowDisc />
                </Link>
                <button type="button" className={`${buttonStyles.secondary} pl-5`} onClick={() => seek(0)}>
                  Watch again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mk flex flex-wrap items-center gap-2 border-t border-hairline bg-white px-4 py-3 sm:px-5">
        <span className="mr-1 text-sm text-slate-600">Jump to</span>
        {CHAPTER_LIST.map((c) => {
          const active = current >= c.start && current < c.end
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => seek(c.start)}
              aria-current={active || undefined}
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-colors duration-150 ${
                active ? 'bg-ink text-white ring-ink' : 'bg-white text-slate-700 ring-hairline hover:ring-slate-300'
              }`}
            >
              {c.label} <span className={active ? 'text-white/70' : 'text-slate-400'}>{formatTime(c.start)}</span>
            </button>
          )
        })}
        <span className="ml-auto hidden text-xs text-slate-600 sm:inline">Demo school with sample data</span>
      </div>
    </Modal>
  )
}
