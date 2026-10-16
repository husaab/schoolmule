// src/lib/attachments.ts
// How a classwork attachment (a file or a link) is named, badged and
// previewed, shared by the teacher's attachment editor, the read-only lists
// students and parents get, and the preview window. The upload and link
// rules mirror the server's (utils/classworkUpload.js). Pure, so it is
// unit-tested (attachments.test.ts).

import type { Attachment } from '@/services/types/classwork'

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_ATTACHMENTS = 20
/** Files per upload request (the server's multer limit). */
export const UPLOAD_BATCH = 5
export const LINK_TITLE_MAX = 200
const URL_MAX = 2000

const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp4', '.webm']
/** The file picker's `accept`. */
export const ATTACHMENT_ACCEPT = ACCEPTED_EXTENSIONS.join(',')

type AttachmentLike = Pick<Attachment, 'kind' | 'title' | 'fileName' | 'mimeType' | 'sizeBytes' | 'url' | 'youtubeId'>

const extensionOf = (name: string | null | undefined): string => {
  const m = /\.([a-z0-9]+)$/i.exec(name ?? '')
  return m ? `.${m[1].toLowerCase()}` : ''
}

type FileFamily = 'image' | 'pdf' | 'video' | 'doc' | 'ppt' | 'other'

function familyOf(a: Pick<Attachment, 'mimeType' | 'fileName'>): FileFamily {
  const mime = (a.mimeType ?? '').toLowerCase()
  const ext = extensionOf(a.fileName)
  if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image'
  if (mime === 'application/pdf' || ext === '.pdf') return 'pdf'
  if (mime.startsWith('video/') || ['.mp4', '.webm'].includes(ext)) return 'video'
  if (mime.includes('word') || ['.doc', '.docx'].includes(ext)) return 'doc'
  if (mime.includes('powerpoint') || mime.includes('presentation') || ['.ppt', '.pptx'].includes(ext)) return 'ppt'
  return 'other'
}

export type PreviewKind = 'image' | 'pdf' | 'video' | 'youtube' | 'link' | 'download'

/** What the preview window shows: the file or video in place, a link to open, or a download. */
export function previewKind(a: Pick<Attachment, 'kind' | 'mimeType' | 'fileName' | 'youtubeId'>): PreviewKind {
  if (a.kind === 'link') return a.youtubeId ? 'youtube' : 'link'
  const family = familyOf(a)
  if (family === 'image' || family === 'pdf' || family === 'video') return family
  return 'download'
}

export interface AttachmentBadge {
  label: 'PDF' | 'IMG' | 'VID' | 'DOC' | 'PPT' | 'LINK' | 'FILE'
  /** Tailwind classes of the badge tile. */
  className: string
}

const BADGES: Record<AttachmentBadge['label'], string> = {
  PDF: 'border-rose-200 bg-rose-50 text-rose-700',
  IMG: 'border-teal-200 bg-teal-50 text-teal-700',
  VID: 'border-violet-200 bg-violet-50 text-violet-700',
  DOC: 'border-blue-200 bg-blue-50 text-blue-700',
  PPT: 'border-orange-200 bg-orange-50 text-orange-700',
  LINK: 'border-sky-200 bg-sky-50 text-sky-700',
  FILE: 'border-slate-200 bg-slate-50 text-slate-600',
}

/** PDF · IMG · VID · DOC · PPT · LINK (a YouTube link is a video). */
export function attachmentBadge(a: Pick<Attachment, 'kind' | 'mimeType' | 'fileName' | 'youtubeId'>): AttachmentBadge {
  let label: AttachmentBadge['label']
  if (a.kind === 'link') label = a.youtubeId ? 'VID' : 'LINK'
  else {
    const family = familyOf(a)
    label = family === 'image' ? 'IMG' : family === 'pdf' ? 'PDF' : family === 'video' ? 'VID' : family === 'doc' ? 'DOC' : family === 'ppt' ? 'PPT' : 'FILE'
  }
  return { label, className: BADGES[label] }
}

/** "example.com/cells" from "https://www.example.com/cells". */
function shortUrl(url: string | null): { host: string; path: string } | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = `${u.pathname === '/' ? '' : u.pathname}${u.search}`
    return { host, path }
  } catch {
    return null
  }
}

/** What a row calls the attachment: its title, else the file name or the address. */
export function attachmentName(a: AttachmentLike): string {
  const title = a.title?.trim()
  if (title) return title
  if (a.kind === 'file') return a.fileName?.trim() || 'File'
  const short = shortUrl(a.url)
  return short ? `${short.host}${short.path}` : a.url ?? 'Link'
}

/** "120 KB", "2.5 MB". */
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

/** The quiet line under the name: a file's size, a link's site ("YouTube video"). */
export function attachmentMeta(a: AttachmentLike): string {
  if (a.kind === 'file') return a.sizeBytes != null ? formatSize(a.sizeBytes) : ''
  if (a.youtubeId) return 'YouTube video'
  return shortUrl(a.url)?.host ?? ''
}

/** The id of a YouTube video link (watch?v=, youtu.be/, /shorts/, /embed/, /live/), else null. Same rule as the server. */
export function youtubeIdOf(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, '')
  let id: string | null = null
  if (host === 'youtu.be') id = u.pathname.split('/')[1] || null
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v')
    else id = /^\/(?:shorts|embed|live)\/([^/]+)/.exec(u.pathname)?.[1] ?? null
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

export const youtubeEmbedUrl = (id: string): string => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`

/**
 * A link as typed, ready to send: trimmed, https:// added to a bare address,
 * http or https only, 2,000 characters at most. Null when it can't be a link.
 */
export function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  if (withScheme.length > URL_MAX) return null
  try {
    const u = new URL(withScheme)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!u.hostname.includes('.')) return null
    return withScheme
  } catch {
    return null
  }
}

/** Which picked files can go up, and why the others can't (one line each). */
export function checkNewFiles<F extends { name: string; size: number }>(
  files: F[],
  existingCount: number,
): { accepted: F[]; problems: string[] } {
  const accepted: F[] = []
  const problems: string[] = []
  let room = Math.max(0, MAX_ATTACHMENTS - existingCount)
  let full = false
  for (const f of files) {
    if (!ACCEPTED_EXTENSIONS.includes(extensionOf(f.name))) problems.push(`${f.name} isn't a type students can open here.`)
    else if (f.size > MAX_ATTACHMENT_BYTES) problems.push(`${f.name} is over 10 MB.`)
    else if (room === 0) full = true
    else {
      accepted.push(f)
      room -= 1
    }
  }
  if (full) problems.push(`An item holds at most ${MAX_ATTACHMENTS} attachments.`)
  return { accepted, problems }
}
