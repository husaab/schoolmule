// src/lib/uploadPrep.ts
// Every picture a user uploads is resized in the browser first (owner
// request, final fix wave): the files picked are redrawn by downscaleImage
// (src/lib/imageDownscale.ts), one at a time, and only then checked against
// the upload point's type and size rules. So a 6 MB phone photo goes up as a
// ~1 MB JPEG instead of being refused as "over 3 MB". GIFs, HEIC (except
// where a preset decodes it), PDFs and documents are never touched.
//
// Each upload point names a preset:
//   attachment  classwork, Stream / announcement and message attachments:
//               2000 px; photos as JPEG; PNG screenshots stay PNG.
//   quizImage   a quiz question's picture: as attachment, under 3 MB, and a
//               HEIC the browser can decode becomes a JPEG (the server takes
//               JPEG, PNG and WebP only).
//   screenshot  patch-note screenshots: crisp, 2400 px, PNG kept.
//   logo        school assets (logos, signatures): 2400 px, PNG kept.
//   banner      the registration form banner: 2400 px, PNG kept.
//   print       an agenda's custom page, printed full-page: 3000 px, 90 %.
//
// The original size of a resized file is remembered so a chip can say
// "1.2 MB · resized from 6.4 MB". Pure apart from the redraw, which is
// injectable for tests (uploadPrep.test.ts).

import { downscaleImage, type DownscaleOptions } from './imageDownscale'

export type UploadPreset = 'attachment' | 'quizImage' | 'screenshot' | 'logo' | 'banner' | 'print'

export const QUIZ_IMAGE_MAX_BYTES = 3 * 1024 * 1024

export const UPLOAD_PRESETS: Record<UploadPreset, DownscaleOptions> = {
  attachment: { maxEdge: 2000, quality: 0.85, keepPng: true },
  quizImage: { maxEdge: 2000, quality: 0.85, keepPng: true, maxBytes: QUIZ_IMAGE_MAX_BYTES, decodeAny: true },
  screenshot: { maxEdge: 2400, quality: 0.9, keepPng: true },
  logo: { maxEdge: 2400, quality: 0.9, keepPng: true },
  banner: { maxEdge: 2400, quality: 0.88, keepPng: true },
  print: { maxEdge: 3000, quality: 0.9, keepPng: true },
}

export type Resize = (file: File, opts: DownscaleOptions) => Promise<File>

// A resized file's original size, for "resized from …".
const originals = new WeakMap<File, number>()

/** The size the file had before it was resized, or null when it went up as picked. */
export const originalSizeOf = (file: File): number | null => originals.get(file) ?? null

/**
 * The picked files ready to upload, in order: each picture resized (one at a
 * time — a 12 MP photo is about 48 MB decoded), everything else as it was.
 * Never throws: a picture that can't be resized stays as it was, and the
 * upload point's own checks decide about it.
 */
export async function prepareUploads(files: File[], preset: UploadPreset, resize: Resize = downscaleImage): Promise<File[]> {
  const out: File[] = []
  for (const file of files) {
    let ready = file
    try {
      ready = await resize(file, UPLOAD_PRESETS[preset])
    } catch {
      ready = file
    }
    if (ready !== file) originals.set(ready, originalSizeOf(file) ?? file.size)
    out.push(ready)
  }
  return out
}

/**
 * Resize first, then run the upload point's checks on what will actually go
 * up (the order every picker must use).
 */
export async function prepareThenCheck<R>(
  files: File[],
  preset: UploadPreset,
  check: (prepared: File[]) => R,
  resize: Resize = downscaleImage,
): Promise<R> {
  return check(await prepareUploads(files, preset, resize))
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

/** "1.2 MB", or "1.2 MB · resized from 6.4 MB" for a picture that was resized. */
export function uploadSizeLabel(file: File): string {
  const before = originalSizeOf(file)
  const now = formatBytes(file.size)
  return before !== null && before > file.size ? `${now} · resized from ${formatBytes(before)}` : now
}
