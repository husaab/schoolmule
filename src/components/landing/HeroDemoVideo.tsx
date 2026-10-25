'use client'
import { FC } from 'react'
import FilmPlayer from '@/components/marketing/film/FilmPlayer'
import { HERO_LOOP } from '@/lib/marketing/site'

/**
 * The homepage's centrepiece: the film (remotion/src/demo) plays muted on a
 * loop, and "Watch with sound" opens it from the start in a modal. It pauses
 * off screen, and reduced-motion visitors get the poster.
 *
 * The loop is a 17-second silent cut of the film ("One school. Every view."
 * into the teacher's morning), under 1 MB (about 330 KB on phones), so phones
 * no longer download the full 10 MB film to play it silently.
 */
const HeroDemoVideo: FC = () => (
  <FilmPlayer
    src={HERO_LOOP.src}
    srcSmall={HERO_LOOP.srcSmall}
    poster={HERO_LOOP.poster}
    startAt={0}
    from="hero"
    priority
  />
)

export default HeroDemoVideo
