'use client'
import { FC, useEffect, useRef } from 'react'

const HeroDemoVideo: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // React sets the `muted` attribute but not the DOM property reliably, which can
  // leave the video unmuted and blocked from autoplaying. Force it muted on mount.
  useEffect(() => {
    const v = videoRef.current
    if (v) {
      v.muted = true
      void v.play().catch(() => {})
    }
  }, [])

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900">
      <video
        ref={videoRef}
        className="block w-full aspect-video object-cover"
        autoPlay
        muted
        loop
        playsInline
        controls
        controlsList="nodownload noplaybackrate"
        preload="metadata"
        poster="/videos/feature-tour-poster.jpg"
      >
        <source src="/videos/feature-tour.mp4" type="video/mp4" />
      </video>
    </div>
  )
}

export default HeroDemoVideo
