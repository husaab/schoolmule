import { describe, expect, it, vi } from 'vitest'
import { checkNewFiles } from './attachments'
import { fileProblem } from '@/components/messaging/formatters'
import { quizImageProblem } from './quizBuilder'
import { UPLOAD_PRESETS, originalSizeOf, prepareThenCheck, prepareUploads, uploadSizeLabel, type Resize } from './uploadPrep'

const MB = 1024 * 1024
const file = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type })

// A stand-in for the canvas: photos over 1 MB come back as a 1 MB JPEG; anything else as it was.
const shrink: Resize = vi.fn(async (f: File) =>
  f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/heic'
    ? f.size > MB
      ? file(f.name.replace(/\.\w+$/, '.jpg'), 'image/jpeg', MB)
      : f
    : f,
)

describe('resize first, then check (every image upload point)', () => {
  it('a 12 MB phone photo passes the 10 MB attachment check once resized', async () => {
    const photo = file('IMG_0412.jpg', 'image/jpeg', 12 * MB)
    // Checked as picked, it would be refused …
    expect(checkNewFiles([photo], 0).problems).toEqual(['IMG_0412.jpg is over 10 MB.'])
    // … resized first, it goes up.
    const { accepted, problems } = await prepareThenCheck([photo], 'attachment', (ready) => checkNewFiles(ready, 0), shrink)
    expect(problems).toEqual([])
    expect(accepted).toHaveLength(1)
    expect(accepted[0].size).toBe(MB)
  })

  it('the check sees the resized files, never the originals', async () => {
    const check = vi.fn((ready: File[]) => ready.map((f) => f.size))
    const sizes = await prepareThenCheck([file('a.jpg', 'image/jpeg', 6 * MB), file('notes.pdf', 'application/pdf', 2 * MB)], 'attachment', check, shrink)
    expect(check).toHaveBeenCalledTimes(1)
    expect(sizes).toEqual([MB, 2 * MB])
  })

  it('a message photo over 10 MB is sent resized instead of refused', async () => {
    const photo = file('board.jpg', 'image/jpeg', 11 * MB)
    expect(fileProblem(photo)).toMatch(/larger than 10 MB/)
    const [ready] = await prepareUploads([photo], 'attachment', shrink)
    expect(fileProblem(ready)).toBeNull()
  })

  it('a 5 MB quiz picture is resized under 3 MB instead of refused', async () => {
    const photo = file('worksheet.jpg', 'image/jpeg', 5 * MB)
    expect(quizImageProblem(photo)).toMatch(/over 3 MB/)
    const [ready] = await prepareUploads([photo], 'quizImage', shrink)
    expect(quizImageProblem(ready)).toBeNull()
  })

  it('a quiz HEIC the browser decodes is accepted as a JPEG', async () => {
    const heic = file('IMG_1.heic', 'image/heic', 4 * MB)
    expect(quizImageProblem(heic)).toMatch(/JPEG, PNG or WebP/)
    const [ready] = await prepareUploads([heic], 'quizImage', shrink)
    expect(ready.type).toBe('image/jpeg')
    expect(quizImageProblem(ready)).toBeNull()
  })

  it('a PDF, a GIF or a Word file goes up as it was, and is still checked', async () => {
    const pdf = file('big.pdf', 'application/pdf', 11 * MB)
    const gif = file('wiggle.gif', 'image/gif', 2 * MB)
    const ready = await prepareUploads([pdf, gif], 'attachment', shrink)
    expect(ready[0]).toBe(pdf)
    expect(ready[1]).toBe(gif)
    expect(checkNewFiles(ready, 0).problems).toEqual(['big.pdf is over 10 MB.'])
  })

  it('a redraw that fails leaves the original for the check to decide', async () => {
    const broken: Resize = async () => {
      throw new Error('canvas lost')
    }
    const photo = file('a.jpg', 'image/jpeg', 2 * MB)
    expect(await prepareUploads([photo], 'attachment', broken)).toEqual([photo])
  })

  it('resizes one picture at a time, in order', async () => {
    const order: string[] = []
    const slow: Resize = async (f) => {
      order.push(`start ${f.name}`)
      await new Promise((r) => setTimeout(r, 1))
      order.push(`end ${f.name}`)
      return f
    }
    await prepareUploads([file('1.jpg', 'image/jpeg', 1), file('2.jpg', 'image/jpeg', 1)], 'attachment', slow)
    expect(order).toEqual(['start 1.jpg', 'end 1.jpg', 'start 2.jpg', 'end 2.jpg'])
  })

  it('passes each upload point its preset', async () => {
    const seen = vi.fn(async (f: File) => f)
    await prepareUploads([file('a.png', 'image/png', 1)], 'print', seen)
    expect(seen).toHaveBeenCalledWith(expect.any(File), UPLOAD_PRESETS.print)
    expect(UPLOAD_PRESETS.attachment.keepPng).toBe(true)
    expect(UPLOAD_PRESETS.quizImage.maxBytes).toBe(3 * MB)
    expect(UPLOAD_PRESETS.print.maxEdge).toBe(3000)
  })
})

describe('the resized size is shown', () => {
  it('says what a resized picture weighs now and before', async () => {
    const [ready] = await prepareUploads([file('IMG.jpg', 'image/jpeg', 6.4 * MB)], 'attachment', shrink)
    expect(originalSizeOf(ready)).toBe(Math.floor(6.4 * MB))
    expect(uploadSizeLabel(ready)).toBe('1 MB · resized from 6.4 MB')
  })

  it('says just the size of a file that went up as picked', () => {
    const pdf = file('a.pdf', 'application/pdf', 300 * 1024)
    expect(originalSizeOf(pdf)).toBeNull()
    expect(uploadSizeLabel(pdf)).toBe('300 KB')
  })
})
