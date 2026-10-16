// Google's browser scripts, loaded on demand rather than app-wide: only the
// screens that use them (the Sheets picker, the Google sign-in button) pay
// for them.

export const GAPI_SRC = 'https://apis.google.com/js/api.js'
export const GIS_SRC = 'https://accounts.google.com/gsi/client'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any
    google?: any
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// One load per script per page. Keeping the promise, not just checking for
// the tag, matters: a second caller that arrives while the first load is
// still in flight (React runs effects twice in development) must wait for
// it, not resolve before the script has defined anything.
const loads = new Map<string, Promise<void>>()

export function loadScript(src: string): Promise<void> {
  const existing = loads.get(src)
  if (existing) return existing

  const load = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      // Let a later attempt try again (a flaky network, a blocker turned off).
      loads.delete(src)
      el.remove()
      reject(new Error(`Could not load ${src}`))
    }
    document.head.appendChild(el)
  })
  loads.set(src, load)
  return load
}
