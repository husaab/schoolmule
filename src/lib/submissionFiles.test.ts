import { describe, it, expect } from 'vitest'
import {
  MAX_SUBMISSION_BYTES,
  MAX_SUBMISSION_FILES,
  SUBMISSION_ACCEPT,
  UPLOAD_BATCH,
  batchesOf,
  checkSubmissionFile,
  checkSubmissionFiles,
  withMimeType,
} from './submissionFiles'

const file = (name: string, type: string, size = 100) => new File([new Uint8Array(size)], name, { type })

describe('the limits', () => {
  it('match the server', () => {
    expect(MAX_SUBMISSION_BYTES).toBe(10 * 1024 * 1024)
    expect(MAX_SUBMISSION_FILES).toBe(20)
    expect(UPLOAD_BATCH).toBe(5)
  })

  it('accept photos, PDFs, Word and PowerPoint files, and no video', () => {
    for (const ext of ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.pdf', '.doc', '.docx', '.ppt', '.pptx']) {
      expect(SUBMISSION_ACCEPT.split(',')).toContain(ext)
    }
    expect(SUBMISSION_ACCEPT).not.toContain('.mp4')
  })
})

describe('checkSubmissionFile', () => {
  it('lets an allowed type through', () => {
    expect(checkSubmissionFile(file('plant-cell.jpg', 'image/jpeg'))).toBeNull()
    expect(checkSubmissionFile(file('essay.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBeNull()
    expect(checkSubmissionFile(file('IMG_1.HEIC', 'image/heic'))).toBeNull()
  })

  it('judges a file with no type by its extension', () => {
    expect(checkSubmissionFile(file('IMG_1.heic', ''))).toBeNull()
    expect(checkSubmissionFile(file('notes.txt', ''))).toBe('"notes.txt" can\'t be turned in. Use a photo, PDF, Word or PowerPoint file.')
  })

  it('refuses .heif, which the server does not take (only .heic)', () => {
    expect(SUBMISSION_ACCEPT.split(',')).not.toContain('.heif')
    expect(checkSubmissionFile(file('IMG_1.heif', 'image/heif'))).toContain("can't be turned in")
  })

  it('refuses a video, a spreadsheet and the like', () => {
    expect(checkSubmissionFile(file('clip.mp4', 'video/mp4'))).toBe('"clip.mp4" can\'t be turned in. Use a photo, PDF, Word or PowerPoint file.')
    expect(checkSubmissionFile(file('sheet.xlsx', 'application/vnd.ms-excel'))).toContain("can't be turned in")
  })

  it('refuses a file over 10 MB', () => {
    expect(checkSubmissionFile(file('big.pdf', 'application/pdf', MAX_SUBMISSION_BYTES + 1))).toBe('"big.pdf" is too big. Files can be up to 10 MB.')
    expect(checkSubmissionFile(file('ok.pdf', 'application/pdf', MAX_SUBMISSION_BYTES))).toBeNull()
  })

  it('refuses an empty file', () => {
    expect(checkSubmissionFile(file('empty.pdf', 'application/pdf', 0))).toBe('"empty.pdf" is empty.')
  })
})

describe('checkSubmissionFiles', () => {
  it('keeps the good files and reports each bad one', () => {
    const good = file('a.jpg', 'image/jpeg')
    const bad = file('b.mp4', 'video/mp4')
    const result = checkSubmissionFiles([good, bad], 0)
    expect(result.ok).toEqual([good])
    expect(result.problems).toHaveLength(1)
    expect(result.problems[0]).toContain('b.mp4')
  })

  it('stops at 20 files for the work, counting the ones already there', () => {
    const files = Array.from({ length: 4 }, (_, i) => file(`p${i}.jpg`, 'image/jpeg'))
    const result = checkSubmissionFiles(files, 18)
    expect(result.ok.map((f) => f.name)).toEqual(['p0.jpg', 'p1.jpg'])
    expect(result.problems).toEqual(['You can add up to 20 files.'])
  })

  it('says so once when the work is already full', () => {
    const result = checkSubmissionFiles([file('a.jpg', 'image/jpeg'), file('b.jpg', 'image/jpeg')], 20)
    expect(result.ok).toEqual([])
    expect(result.problems).toEqual(['You can add up to 20 files.'])
  })
})

describe('withMimeType', () => {
  it('gives a HEIC photo the type the server expects when the browser sent none', () => {
    const fixed = withMimeType(file('IMG_1.heic', ''))
    expect(fixed.type).toBe('image/heic')
    expect(fixed.name).toBe('IMG_1.heic')
  })

  it('leaves a file that already has a type', () => {
    const f = file('a.jpg', 'image/jpeg')
    expect(withMimeType(f)).toBe(f)
  })

  it('leaves a file whose extension it does not know', () => {
    const f = file('notes.txt', '')
    expect(withMimeType(f)).toBe(f)
  })
})

describe('batchesOf', () => {
  it('splits into groups of at most the batch size', () => {
    expect(batchesOf([1, 2, 3, 4, 5, 6, 7], 5)).toEqual([[1, 2, 3, 4, 5], [6, 7]])
    expect(batchesOf([1, 2], 5)).toEqual([[1, 2]])
    expect(batchesOf([], 5)).toEqual([])
  })
})
