// src/lib/phone.ts
// Phone numbers as people type them: checked the way the server checks them
// (backend utils/phone.js), tidied, never reformatted.

const PHONE_RE = /^\+?[0-9().\-\s]+(?:\s*(?:x|ext\.?)\s*[0-9]+)?$/i

/** A phone number as typed, tidied, or null if it isn't one. */
export function cleanPhone(raw: string | null | undefined): string | null {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim()
  const digits = text.replace(/\D/g, '').length
  if (text.length > 40 || digits < 7 || digits > 20 || !PHONE_RE.test(text)) return null
  return text
}

/** Typed something that isn't a phone number (blank is fine: the number is optional). */
export const badPhone = (raw: string | null | undefined): boolean => String(raw ?? '').trim() !== '' && cleanPhone(raw) === null

/** A tel: link for a number as typed. */
export const telHref = (phone: string): string => `tel:${phone.replace(/(?:x|ext\.?).*$/i, '').replace(/[^0-9+]/g, '')}`
