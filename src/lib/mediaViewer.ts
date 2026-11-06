// src/lib/mediaViewer.ts
// What the media viewer can show and in what order, for every place a file is
// pressed. A surface hands over all of its files; the ones the viewer can't
// show (a Word document, on the app a PDF) stay as they were. Pure, so it is
// unit-tested (mediaViewer.test.ts).

import { previewKind } from '@/lib/attachments'
import type { Attachment as ClassworkAttachment } from '@/services/types/classwork'
import type { Message } from '@/services/types/messaging'
import type { PatchNote } from '@/services/types/patchNote'

export type ViewerKind = 'image' | 'pdf'

/** One file as a surface knows it. */
export interface ViewerFile {
  id: string
  /** What the viewer calls it. */
  name: string
  mimeType?: string | null
  /** The file's real name, when `name` is a title: its extension, and what a download is called. */
  fileName?: string | null
  /** An address already at hand. Signed links last an hour, so this one may be dead. */
  url?: string | null
  /** Asks the server for a fresh address. Left out when there is no such endpoint. */
  resolve?: () => Promise<string>
}

export interface ViewerItem extends ViewerFile {
  kind: ViewerKind
}

export function viewerKind(file: Pick<ViewerFile, 'name' | 'mimeType' | 'fileName'>): ViewerKind | null {
  const kind = previewKind({ kind: 'file', mimeType: file.mimeType ?? null, fileName: file.fileName ?? file.name, youtubeId: null })
  return kind === 'image' || kind === 'pdf' ? kind : null
}

/** The files the viewer can show, in the order given. */
export function viewerItems(files: ViewerFile[], { pdfs = true }: { pdfs?: boolean } = {}): ViewerItem[] {
  const items: ViewerItem[] = []
  for (const file of files) {
    const kind = viewerKind(file)
    if (kind === 'image' || (kind === 'pdf' && pdfs)) items.push({ ...file, kind })
  }
  return items
}

/** Files on a message or a post. `url` is left out where the payload carries none, so each is asked for on opening. */
export function attachmentFiles(
  attachments: { attachmentId: string; fileName: string; mimeType: string; url?: string | null }[],
  resolve: (attachmentId: string) => Promise<string>,
): ViewerFile[] {
  return attachments.map((a) => ({
    id: a.attachmentId,
    name: a.fileName,
    mimeType: a.mimeType,
    url: a.url,
    resolve: () => resolve(a.attachmentId),
  }))
}

/** Every file still in a thread, oldest first: a removed message's files are gone with it. */
export function threadFiles(messages: Message[], resolve: (attachmentId: string) => Promise<string>): ViewerFile[] {
  return messages.filter((m) => m.kind !== 'system' && !m.deletedAt).flatMap((m) => attachmentFiles(m.attachments, resolve))
}

/** A student's turned-in files. A teacher's list comes with addresses; a student's and a parent's ask for each. */
export function submissionFiles<F extends { fileId: string; fileName: string; mimeType?: string | null; url?: string | null }>(
  files: F[],
  resolve?: (file: F) => Promise<string>,
): ViewerFile[] {
  return files.map((f) => ({
    id: f.fileId,
    name: f.fileName,
    mimeType: f.mimeType,
    url: f.url,
    resolve: resolve && (() => resolve(f)),
  }))
}

/** A classwork item's files. Its links are not files: they keep their own way of opening. */
export function classworkFiles(
  attachments: ClassworkAttachment[],
  nameOf: (a: ClassworkAttachment) => string,
  resolve: (a: ClassworkAttachment) => Promise<string>,
): ViewerFile[] {
  return attachments
    .filter((a) => a.kind === 'file')
    .map((a) => ({
      id: a.attachmentId,
      name: nameOf(a),
      mimeType: a.mimeType,
      fileName: a.fileName,
      url: a.url,
      resolve: () => resolve(a),
    }))
}

/** The screenshots among a set of What's New notes. Their addresses are permanent, so there is nothing to refresh. */
export function patchNoteFiles(notes: Pick<PatchNote, 'patchNoteId' | 'title' | 'imageUrl'>[]): ViewerFile[] {
  const files: ViewerFile[] = []
  for (const note of notes) {
    if (!note.imageUrl) continue
    const fileName = note.imageUrl.split('?')[0].split('/').pop() || note.title
    files.push({ id: note.patchNoteId, name: note.title, mimeType: 'image/png', fileName, url: note.imageUrl })
  }
  return files
}

/** The next spot in the list, staying put at either end. */
export function stepIndex(index: number, direction: 1 | -1, count: number): number {
  return Math.min(count - 1, Math.max(0, index + direction))
}

/** "2 of 5". */
export const counterLabel = (index: number, count: number): string => `${index + 1} of ${count}`

/**
 * The address that saves a file rather than showing it. A browser ignores the
 * `download` attribute across origins, so a signed storage link has to ask
 * Storage for it (the same parameter the Supabase SDK adds). Any other address
 * (our own static files, a file still on this device) is left as it is, and
 * there the attribute works.
 */
export function downloadUrl(url: string, fileName: string): string {
  if (!/\/storage\/v1\/object\/sign\//.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(fileName)}`
}
