'use client'
import { track } from '@vercel/analytics'

// One film modal serves the whole website (FilmModalHost, in the marketing
// layout). Any button opens it at a chapter with openFilm(); loops listen for
// FILM_STATE so they pause while the film plays with sound.

export const OPEN_FILM = 'mk:open-film'
export const FILM_STATE = 'mk:film-state'

export interface OpenFilmDetail {
  start: number
  from: string
}

export function openFilm(start = 0, from = 'unknown') {
  window.dispatchEvent(new CustomEvent<OpenFilmDetail>(OPEN_FILM, { detail: { start, from } }))
}

export function announceFilmState(open: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(FILM_STATE, { detail: open }))
}

/** Web Analytics custom events. Never throws: analytics must not break a page. */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props)
  } catch {
    // ignore
  }
}
