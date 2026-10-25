'use client'
import { FC, useEffect, useRef, useState } from 'react'
import { PlayIcon } from '@heroicons/react/24/solid'
import Modal from '@/components/shared/modal'

// The SchoolMule film (remotion/src/demo): 1:41 of real product screens, from the
// teacher's morning to the parent's question. Phones get the 720p cut.
const FilmSources: FC = () => (
  <>
    <source src="/videos/schoolmule-demo-720p.mp4" type="video/mp4" media="(max-width: 767px)" />
    <source src="/videos/schoolmule-demo-1080p.mp4" type="video/mp4" />
  </>
)

const POSTER = '/videos/schoolmule-demo-poster.jpg'

/**
 * The homepage's centrepiece: the film plays muted on a loop, and "Watch with
 * sound" opens it from the start in a modal.
 */
const HeroDemoVideo: FC = () => {
  const loopRef = useRef<HTMLVideoElement>(null)
  const [onScreen, setOnScreen] = useState(false)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    const v = loopRef.current
    if (!v) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(v)
    return () => observer.disconnect()
  }, [])

  // The loop runs only while it's on screen and the full film isn't open, and
  // never for visitors who've asked for reduced motion (they get the poster).
  useEffect(() => {
    const v = loopRef.current
    if (!v) return
    // React sets the `muted` attribute but not the DOM property reliably, and
    // only a muted video may autoplay.
    v.muted = true
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (onScreen && !watching && !calm) void v.play().catch(() => {})
    else v.pause()
  }, [onScreen, watching])

  return (
    <>
      <div
        className="group relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5 bg-slate-100 cursor-pointer"
        onClick={() => setWatching(true)}
      >
        <video
          ref={loopRef}
          className="block w-full aspect-video object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          aria-hidden="true"
        >
          <FilmSources />
        </video>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setWatching(true)
          }}
          className="absolute right-3 top-3 sm:right-5 sm:top-5 inline-flex items-center gap-2.5 rounded-full bg-white/90 backdrop-blur py-1.5 pl-1.5 pr-4 text-sm sm:text-base font-semibold text-slate-900 shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 group-hover:bg-white group-hover:-translate-y-0.5 group-hover:shadow-xl cursor-pointer"
        >
          <span className="grid place-items-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
            <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 translate-x-px" />
          </span>
          Watch with sound
          <span className="font-medium text-slate-500">1:41</span>
        </button>
      </div>

      <Modal
        isOpen={watching}
        onClose={() => setWatching(false)}
        closeOnEscape
        ariaLabel="SchoolMule product film"
        style="w-[min(94vw,150vh)]"
        maxHeightClass="max-h-[94vh]"
      >
        <video className="block w-full aspect-video bg-slate-100" autoPlay controls playsInline controlsList="nodownload noplaybackrate" poster={POSTER}>
          <FilmSources />
        </video>
      </Modal>
    </>
  )
}

export default HeroDemoVideo
