import { describe, it, expect } from 'vitest'
import {
  MAX_ATTACHMENT_BYTES,
  attachmentBadge,
  attachmentMeta,
  attachmentName,
  checkNewFiles,
  normalizeLinkUrl,
  previewKind,
  youtubeEmbedUrl,
  youtubeIdOf,
} from './attachments'
import type { Attachment } from '@/services/types/classwork'

const file = (over: Partial<Attachment> = {}): Attachment => ({
  attachmentId: 'a1',
  kind: 'file',
  title: null,
  fileName: 'cell-parts-checklist.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 120 * 1024,
  url: 'https://storage.example.com/signed',
  youtubeId: null,
  ...over,
})

const link = (over: Partial<Attachment> = {}): Attachment => ({
  attachmentId: 'a2',
  kind: 'link',
  title: 'Video: Inside a plant cell (4 min)',
  fileName: null,
  mimeType: null,
  sizeBytes: null,
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  youtubeId: 'dQw4w9WgXcQ',
  ...over,
})

describe('previewKind', () => {
  it('opens images, PDFs, videos and YouTube in place', () => {
    expect(previewKind(file({ mimeType: 'image/png', fileName: 'x.png' }))).toBe('image')
    expect(previewKind(file())).toBe('pdf')
    expect(previewKind(file({ mimeType: 'video/mp4', fileName: 'x.mp4' }))).toBe('video')
    expect(previewKind(link())).toBe('youtube')
  })

  it('other links open, other files download', () => {
    expect(previewKind(link({ youtubeId: null, url: 'https://example.com/a' }))).toBe('link')
    expect(previewKind(file({ mimeType: 'application/msword', fileName: 'x.doc' }))).toBe('download')
  })

  it('falls back to the extension when the type is missing', () => {
    expect(previewKind(file({ mimeType: null, fileName: 'photo.JPG' }))).toBe('image')
    expect(previewKind(file({ mimeType: null, fileName: 'notes.pdf' }))).toBe('pdf')
  })
})

describe('attachmentBadge', () => {
  it('names the type', () => {
    expect(attachmentBadge(file()).label).toBe('PDF')
    expect(attachmentBadge(file({ mimeType: 'image/jpeg', fileName: 'a.jpg' })).label).toBe('IMG')
    expect(attachmentBadge(file({ mimeType: 'video/webm', fileName: 'a.webm' })).label).toBe('VID')
    expect(attachmentBadge(file({ mimeType: null, fileName: 'a.docx' })).label).toBe('DOC')
    expect(attachmentBadge(file({ mimeType: null, fileName: 'a.pptx' })).label).toBe('PPT')
    expect(attachmentBadge(link()).label).toBe('VID')
    expect(attachmentBadge(link({ youtubeId: null, url: 'https://example.com' })).label).toBe('LINK')
  })
})

describe('attachmentName / attachmentMeta', () => {
  it('a file reads its title, else its file name, and its size', () => {
    expect(attachmentName(file())).toBe('cell-parts-checklist.pdf')
    expect(attachmentName(file({ title: 'Checklist' }))).toBe('Checklist')
    expect(attachmentMeta(file())).toBe('120 KB')
    expect(attachmentMeta(file({ sizeBytes: 2.5 * 1024 * 1024 }))).toBe('2.5 MB')
    expect(attachmentMeta(file({ sizeBytes: null }))).toBe('')
  })

  it('a link reads its title, else its address, and where it goes', () => {
    expect(attachmentName(link())).toBe('Video: Inside a plant cell (4 min)')
    expect(attachmentName(link({ title: null, url: 'https://www.example.com/cells' }))).toBe('example.com/cells')
    expect(attachmentMeta(link())).toBe('YouTube video')
    expect(attachmentMeta(link({ youtubeId: null, url: 'https://www.example.com/cells' }))).toBe('example.com')
  })
})

describe('youtubeIdOf', () => {
  it('reads the id from every form the server accepts', () => {
    expect(youtubeIdOf('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeIdOf('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ')
    expect(youtubeIdOf('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeIdOf('https://m.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeIdOf('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('is null for anything else', () => {
    expect(youtubeIdOf('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(youtubeIdOf('https://www.youtube.com/watch?v=short')).toBeNull()
    expect(youtubeIdOf('not a url')).toBeNull()
  })

  it('embeds through youtube-nocookie', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})

describe('normalizeLinkUrl', () => {
  it('keeps http and https links, trimmed', () => {
    expect(normalizeLinkUrl(' https://example.com/a ')).toBe('https://example.com/a')
    expect(normalizeLinkUrl('http://example.com')).toBe('http://example.com')
  })

  it('adds https:// to a bare address', () => {
    expect(normalizeLinkUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('refuses other schemes, blanks and very long links', () => {
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeLinkUrl('ftp://example.com')).toBeNull()
    expect(normalizeLinkUrl('   ')).toBeNull()
    expect(normalizeLinkUrl(`https://example.com/${'a'.repeat(2000)}`)).toBeNull()
  })
})

describe('checkNewFiles', () => {
  const f = (name: string, size = 1000) => ({ name, size })

  it('takes the server-accepted types under 10 MB', () => {
    const { accepted, problems } = checkNewFiles([f('a.pdf'), f('b.mp4'), f('c.exe'), f('d.png', MAX_ATTACHMENT_BYTES + 1)], 0)
    expect(accepted.map((x) => x.name)).toEqual(['a.pdf', 'b.mp4'])
    expect(problems).toEqual(["c.exe isn't a type students can open here.", 'd.png is over 10 MB.'])
  })

  it('stops at 20 attachments on an item', () => {
    const { accepted, problems } = checkNewFiles([f('a.pdf'), f('b.pdf'), f('c.pdf')], 18)
    expect(accepted.map((x) => x.name)).toEqual(['a.pdf', 'b.pdf'])
    expect(problems).toEqual(['An item holds at most 20 attachments.'])
  })
})
