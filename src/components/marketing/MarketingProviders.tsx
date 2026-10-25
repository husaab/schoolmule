'use client'
import { useEffect, type ReactNode } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import FilmModalHost from './film/FilmModalHost'
import { trackEvent } from './film/filmEvents'

// Client-side pieces every marketing page shares: framer-motion's lightweight
// feature set (components use `m`, not `motion`), reduced motion honoured
// everywhere, the one film modal, and the booked-demo signal from Calendly.
export default function MarketingProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://calendly.com') return
      const event = (e.data as { event?: string } | null)?.event
      if (event === 'calendly.event_scheduled') trackEvent('demo_booked')
      else if (event === 'calendly.date_and_time_selected') trackEvent('demo_time_selected')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {children}
        <FilmModalHost />
      </MotionConfig>
    </LazyMotion>
  )
}
