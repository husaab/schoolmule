import { describe, expect, it, vi } from 'vitest'
import type { Attachment as ClassworkAttachment } from '@/services/types/classwork'
import type { Message } from '@/services/types/messaging'
import { attachmentFiles, classworkFiles, counterLabel, downloadUrl, patchNoteFiles, stepIndex, submissionFiles, threadFiles, viewerItems, viewerKind } from './mediaViewer'

const attachment = (attachmentId: string, fileName: string, mimeType: string, url: string | null = `https://cdn.test/${attachmentId}`) => ({
  attachmentId,
  messageId: 'm',
  fileName,
  mimeType,
  sizeBytes: 10,
  url,
})

const message = (messageId: string, attachments: ReturnType<typeof attachment>[], extra: Partial<Message> = {}) =>
  ({ messageId, kind: 'text', deletedAt: null, attachments, ...extra }) as unknown as Message

describe('viewerKind', () => {
  it('goes by the type', () => {
    expect(viewerKind({ name: 'a', mimeType: 'image/jpeg' })).toBe('image')
    expect(viewerKind({ name: 'a', mimeType: 'application/pdf' })).toBe('pdf')
  })

  it('falls back on the extension', () => {
    expect(viewerKind({ name: 'IMG_7009.JPG' })).toBe('image')
    expect(viewerKind({ name: 'Worksheet', fileName: 'unit-1.pdf' })).toBe('pdf')
  })

  it('leaves out what it cannot show', () => {
    expect(viewerKind({ name: 'essay.docx', mimeType: 'application/msword' })).toBeNull()
    expect(viewerKind({ name: 'clip.mp4', mimeType: 'video/mp4' })).toBeNull()
  })
})

describe('viewerItems', () => {
  const files = [
    { id: '1', name: 'a.jpg', mimeType: 'image/jpeg' },
    { id: '2', name: 'b.pdf', mimeType: 'application/pdf' },
    { id: '3', name: 'c.docx', mimeType: 'application/msword' },
    { id: '4', name: 'd.png', mimeType: 'image/png' },
  ]

  it('keeps images and PDFs in their order', () => {
    expect(viewerItems(files).map((i) => [i.id, i.kind])).toEqual([
      ['1', 'image'],
      ['2', 'pdf'],
      ['4', 'image'],
    ])
  })

  it('drops PDFs where they open elsewhere (the app)', () => {
    expect(viewerItems(files, { pdfs: false }).map((i) => i.id)).toEqual(['1', '4'])
  })
})

describe('threadFiles', () => {
  const resolve = vi.fn(async (id: string) => `https://fresh.test/${id}`)

  it('runs through the whole thread, oldest first', () => {
    const files = threadFiles(
      [
        message('m1', [attachment('a', 'IMG_7009.jpg', 'image/jpeg'), attachment('b', 'IMG_7008.jpg', 'image/jpeg')]),
        message('m2', []),
        message('m3', [attachment('c', 'test.pdf', 'application/pdf', null)]),
      ],
      resolve,
    )
    expect(files.map((f) => f.id)).toEqual(['a', 'b', 'c'])
    expect(files[2].url).toBeNull()
  })

  it("skips a removed message's files and system lines", () => {
    const files = threadFiles(
      [
        message('m1', [attachment('a', 'gone.jpg', 'image/jpeg')], { deletedAt: '2026-11-06T00:00:00Z' }),
        message('m2', [attachment('b', 'note.jpg', 'image/jpeg')], { kind: 'system' } as Partial<Message>),
        message('m3', [attachment('c', 'kept.jpg', 'image/jpeg')]),
      ],
      resolve,
    )
    expect(files.map((f) => f.id)).toEqual(['c'])
  })

  it('asks for a fresh address by attachment', async () => {
    const [file] = threadFiles([message('m1', [attachment('a', 'a.jpg', 'image/jpeg')])], resolve)
    await expect(file.resolve?.()).resolves.toBe('https://fresh.test/a')
  })
})

describe('attachmentFiles', () => {
  it('asks for a fresh address by attachment, with or without one at hand', async () => {
    const files = attachmentFiles(
      [
        { attachmentId: 'a', fileName: 'a.jpg', mimeType: 'image/jpeg', url: 'https://cdn.test/a' },
        { attachmentId: 'b', fileName: 'b.jpg', mimeType: 'image/jpeg' },
      ],
      async (id) => `https://fresh.test/${id}`,
    )
    expect(files[0].url).toBe('https://cdn.test/a')
    expect(files[1].url).toBeUndefined()
    await expect(files[1].resolve?.()).resolves.toBe('https://fresh.test/b')
  })
})

describe('submissionFiles', () => {
  it('keeps a teacher list with addresses and no way to refresh', () => {
    const [file] = submissionFiles([{ fileId: 'f1', fileName: 'a.jpg', mimeType: 'image/jpeg', url: 'https://cdn.test/f1' }])
    expect(file).toMatchObject({ id: 'f1', name: 'a.jpg', url: 'https://cdn.test/f1' })
    expect(file.resolve).toBeUndefined()
  })

  it("asks for a student's or parent's file by file", async () => {
    const [file] = submissionFiles([{ fileId: 'f1', fileName: 'a.jpg', mimeType: 'image/jpeg' }], async (f) => `https://fresh.test/${f.fileId}`)
    await expect(file.resolve?.()).resolves.toBe('https://fresh.test/f1')
  })
})

describe('classworkFiles', () => {
  const att = (attachmentId: string, kind: 'file' | 'link', fileName: string | null, mimeType: string | null, title: string | null = null) =>
    ({ attachmentId, kind, title, fileName, mimeType, sizeBytes: 1, url: `https://cdn.test/${attachmentId}`, youtubeId: null }) as ClassworkAttachment

  it('keeps files, leaves links out, and uses the title as the name', async () => {
    const files = classworkFiles(
      [att('1', 'file', 'scan.pdf', 'application/pdf', 'Unit 1 sheet'), att('2', 'link', null, null)],
      (a) => a.title ?? a.fileName ?? '',
      async (a) => `https://fresh.test/${a.attachmentId}`,
    )
    expect(files).toHaveLength(1)
    expect(files[0]).toMatchObject({ id: '1', name: 'Unit 1 sheet', fileName: 'scan.pdf' })
    expect(viewerKind(files[0])).toBe('pdf')
    await expect(files[0].resolve?.()).resolves.toBe('https://fresh.test/1')
  })
})

describe('patchNoteFiles', () => {
  it('keeps the notes with a screenshot and names the download from the address', () => {
    const files = patchNoteFiles([
      { patchNoteId: '1', title: 'New report cards', imageUrl: '/whats-new/report-cards.png?v=2' },
      { patchNoteId: '2', title: 'Words only', imageUrl: null },
    ])
    expect(files).toEqual([{ id: '1', name: 'New report cards', mimeType: 'image/png', fileName: 'report-cards.png', url: '/whats-new/report-cards.png?v=2' }])
    expect(viewerItems(files)[0].kind).toBe('image')
  })
})

describe('stepIndex', () => {
  it('moves one at a time', () => {
    expect(stepIndex(1, 1, 5)).toBe(2)
    expect(stepIndex(1, -1, 5)).toBe(0)
  })

  it('stays put at the ends', () => {
    expect(stepIndex(0, -1, 5)).toBe(0)
    expect(stepIndex(4, 1, 5)).toBe(4)
    expect(stepIndex(0, 1, 1)).toBe(0)
  })
})

describe('counterLabel', () => {
  it('counts from one', () => {
    expect(counterLabel(1, 5)).toBe('2 of 5')
  })
})

describe('downloadUrl', () => {
  const signed = 'https://x.supabase.co/storage/v1/object/sign/attachments/a/b.jpg?token=abc.def'

  it('asks Storage to send a signed file as a download', () => {
    expect(downloadUrl(signed, 'IMG_7009.jpg')).toBe(`${signed}&download=IMG_7009.jpg`)
  })

  it('keeps an awkward name in one piece', () => {
    expect(downloadUrl(signed, 'Unit test & quiz #1.jpg')).toBe(`${signed}&download=Unit%20test%20%26%20quiz%20%231.jpg`)
  })

  it('leaves our own files and local ones alone', () => {
    expect(downloadUrl('/whats-new/a.png', 'a.png')).toBe('/whats-new/a.png')
    expect(downloadUrl('blob:https://schoolmule.ca/1', 'a.png')).toBe('blob:https://schoolmule.ca/1')
  })
})
