'use client'
import { FC, useRef, useState } from 'react'
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/solid'

const HeroDemoVideo: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Browser header */}
      <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 ml-4">
          <div className="bg-white rounded-md px-4 py-1.5 text-sm text-slate-500 max-w-md">
            schoolmule.ca/dashboard
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="relative aspect-video bg-slate-50">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/feature-tour-poster.jpg"
        >
          <source src="/videos/feature-tour.webm" type="video/webm" />
          <source src="/videos/feature-tour.mp4" type="video/mp4" />
        </video>

        {/* Controls */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={togglePlay}
            aria-label={playing ? 'Pause demo' : 'Play demo'}
            className="w-9 h-9 rounded-full bg-slate-900/60 text-white backdrop-blur-sm flex items-center justify-center hover:bg-slate-900/80 transition-colors"
          >
            {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute demo' : 'Mute demo'}
            className="w-9 h-9 rounded-full bg-slate-900/60 text-white backdrop-blur-sm flex items-center justify-center hover:bg-slate-900/80 transition-colors"
          >
            {muted ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroDemoVideo
