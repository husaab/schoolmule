'use client'
import { FC, useEffect, useState } from 'react'
import Image from 'next/image'

const HeroVideoBackground: FC = () => {
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    setShowVideo(!prefersReduced && !isMobile)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {showVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/hero-loop-poster.jpg"
        >
          <source src="/videos/hero-loop.webm" type="video/webm" />
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/videos/hero-loop-poster.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-60"
        />
      )}
      {/* readability wash: keeps dark navy hero text at accessible contrast */}
      <div className="absolute inset-0 bg-white/50" />
    </div>
  )
}

export default HeroVideoBackground
