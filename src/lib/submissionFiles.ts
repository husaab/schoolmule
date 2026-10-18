// src/lib/submissionFiles.ts
// What a student may add to their work, and how a pick is checked before it
// goes up. The rules mirror the server's (utils/classworkUpload.js,
// uploadSubmissionFiles): photos (JPEG, PNG, GIF, WebP, HEIC), PDF, Word and
// PowerPoint, no video; 10 MB each; 5 per request; 20 per piece of work.
// Pure, so it is unit-tested (submissionFiles.test.ts).

export const MAX_SUBMISSION_BYTES = 10 * 1024 * 1024
export const MAX_SUBMISSION_FILES = 20
/** Files per upload request (the server's multer limit). */
export const UPLOAD_BATCH = 5

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.pdf', '.doc', '.docx', '.ppt', '.pptx']
/** The file picker's `accept` for "Upload a file". */
export const SUBMISSION_ACCEPT = EXTENSIONS.join(',')

/** The type the server matches HEIC against; it is the one a browser may send without a type. */
const MIME_BY_EXTENSION: Record<string, string> = {
  '.heic': 'image/heic',
}

const extensionOf = (name: string): string => {
  const m = /\.[a-z0-9]+$/i.exec(name)
  return m ? m[0].toLowerCase() : ''
}

/** Why a file cannot be added, in words a student can act on; null when it can. */
export function checkSubmissionFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (!EXTENSIONS.includes(extensionOf(file.name))) {
    return `"${file.name}" can't be turned in. Use a photo, PDF, Word or PowerPoint file.`
  }
  if (file.size === 0) return `"${file.name}" is empty.`
  if (file.size > MAX_SUBMISSION_BYTES) return `"${file.name}" is too big. Files can be up to 10 MB.`
  return null
}

/**
 * Checks a pick against the rules and the room left: the files that can go up,
 * and one sentence for each that cannot.
 * @param already files the work holds now (and any still uploading)
 */
export function checkSubmissionFiles(files: File[], already: number): { ok: File[]; problems: string[] } {
  const ok: File[] = []
  const problems: string[] = []
  let full = false
  for (const file of files) {
    const problem = checkSubmissionFile(file)
    if (problem) {
      problems.push(problem)
      continue
    }
    if (already + ok.length >= MAX_SUBMISSION_FILES) {
      full = true
      continue
    }
    ok.push(file)
  }
  if (full) problems.push(`You can add up to ${MAX_SUBMISSION_FILES} files.`)
  return { ok, problems }
}

/** A HEIC photo some browsers send without a type is given the one the server checks for. */
export function withMimeType(file: File): File {
  if (file.type) return file
  const type = MIME_BY_EXTENSION[extensionOf(file.name)]
  return type ? new File([file], file.name, { type, lastModified: file.lastModified }) : file
}

/** Groups of at most `size`, in order. */
export function batchesOf<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
