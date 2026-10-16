// src/components/classes/items/AttachmentsEditor.tsx
// The item form's attachments (the Teacher-Assign board): files and links
// that preview in place, can be renamed and replaced (files), edited (links)
// or removed,
// plus "Upload" and "Link or YouTube". Once the item exists every change is
// saved at once; before that (a new item not saved yet) files and links wait
// in the form and go up right after the item's first save (`flush`).
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpTrayIcon, LinkIcon } from '@heroicons/react/24/outline'
import AttachmentPreviewModal from '@/components/classroom/AttachmentPreviewModal'
import { ATTACHMENT_ACCEPT, UPLOAD_BATCH, checkNewFiles, fileTitlePatch, youtubeIdOf } from '@/lib/attachments'
import {
  addLink as apiAddLink,
  deleteAttachment,
  getAttachmentUrl,
  replaceAttachmentFile,
  updateAttachment,
  uploadAttachments,
} from '@/services/classworkService'
import type { Attachment } from '@/services/types/classwork'
import AttachmentRow from './AttachmentRow'
import LinkEditor from './LinkEditor'

export interface AttachmentEditorRow {
  key: string
  /** The saved attachment, or a stand-in built from what is waiting. */
  attachment: Attachment
  saved: boolean
  /** A file not uploaded yet (or whose upload failed). */
  file?: File
  /** A blob URL of a local file, for its preview and thumbnail. */
  localUrl?: string
  state: 'idle' | 'working' | 'error'
  error?: string
}

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

let localKey = 0
const nextKey = () => `local-${++localKey}`

const savedRow = (a: Attachment): AttachmentEditorRow => ({ key: a.attachmentId, attachment: a, saved: true, state: 'idle' })

function pendingFileRow(file: File): AttachmentEditorRow {
  const key = nextKey()
  return {
    key,
    attachment: {
      attachmentId: key,
      kind: 'file',
      title: null,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      url: null,
      youtubeId: null,
    },
    saved: false,
    file,
    localUrl: URL.createObjectURL(file),
    state: 'idle',
  }
}

function pendingLinkRow(title: string | null, url: string, key = nextKey()): AttachmentEditorRow {
  return {
    key,
    attachment: { attachmentId: key, kind: 'link', title, fileName: null, mimeType: null, sizeBytes: null, url, youtubeId: youtubeIdOf(url) },
    saved: false,
    state: 'idle',
  }
}

export interface AttachmentsState {
  rows: AttachmentEditorRow[]
  /** Problems with the files just picked (wrong type, too big, too many). */
  problems: string[]
  clearProblems: () => void
  /** Rows not saved yet (waiting for the item, or failed). */
  pendingCount: number
  addFiles: (files: File[]) => void
  addLink: (title: string | null, url: string) => Promise<string | null>
  saveLink: (key: string, title: string | null, url: string) => Promise<string | null>
  /** A file's display title (blank = its own name); a file still waiting keeps it until it uploads. */
  renameFile: (key: string, title: string) => Promise<string | null>
  replace: (key: string, file: File) => void
  remove: (key: string) => void
  retry: (key: string) => void
  /** A fresh address for a row's preview. */
  resolveUrl: (row: AttachmentEditorRow) => Promise<string>
  /** Sends everything still waiting to the item; resolves to how many could not be saved. */
  flush: (itemId: string) => Promise<number>
}

/**
 * The attachments' state. `itemId` is null until the item exists; from then
 * on each change is saved straight away.
 */
export function useAttachmentRows(initial: Attachment[], itemId: string | null): AttachmentsState {
  const [rows, setRows] = useState<AttachmentEditorRow[]>(() => initial.map(savedRow))
  const [problems, setProblems] = useState<string[]>([])
  const itemRef = useRef(itemId)
  const rowsRef = useRef(rows)
  useEffect(() => {
    itemRef.current = itemId
  }, [itemId])
  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  // Blob URLs of local files are released with the form.
  useEffect(
    () => () => {
      for (const r of rowsRef.current) if (r.localUrl) URL.revokeObjectURL(r.localUrl)
    },
    [],
  )

  const patchRow = useCallback((key: string, change: (r: AttachmentEditorRow) => AttachmentEditorRow) => {
    setRows((list) => list.map((r) => (r.key === key ? change(r) : r)))
  }, [])

  /** Rows `keys` (local files) become the saved attachments the server sent back, in order. */
  const settleUploaded = useCallback((keys: string[], saved: Attachment[]) => {
    setRows((list) =>
      list.map((r) => {
        const i = keys.indexOf(r.key)
        if (i < 0 || !saved[i]) return r
        if (r.localUrl) URL.revokeObjectURL(r.localUrl)
        return savedRow(saved[i])
      }),
    )
  }, [])

  /** A title given to a file before it uploaded goes to the server now that the file has an id. */
  const sendLocalTitles = useCallback(async (chunk: AttachmentEditorRow[], saved: Attachment[]) => {
    for (let i = 0; i < chunk.length; i++) {
      const title = chunk[i].attachment.title
      const attachment = saved[i]
      if (!title || !attachment) continue
      try {
        const res = await updateAttachment(attachment.attachmentId, { title })
        setRows((list) => list.map((r) => (r.key === attachment.attachmentId ? savedRow(res.data) : r)))
      } catch (err) {
        setRows((list) =>
          list.map((r) =>
            r.key === attachment.attachmentId ? { ...r, state: 'error', error: messageOf(err, "The file's name didn't save.") } : r,
          ),
        )
      }
    }
  }, [])

  const uploadRows = useCallback(
    async (id: string, batch: AttachmentEditorRow[]): Promise<number> => {
      let failed = 0
      for (let i = 0; i < batch.length; i += UPLOAD_BATCH) {
        const chunk = batch.slice(i, i + UPLOAD_BATCH)
        const keys = chunk.map((r) => r.key)
        setRows((list) => list.map((r) => (keys.includes(r.key) ? { ...r, state: 'working', error: undefined } : r)))
        try {
          const res = await uploadAttachments(id, chunk.map((r) => r.file!))
          // The server answers with the new attachments in upload order.
          settleUploaded(keys, res.data)
          await sendLocalTitles(chunk, res.data)
        } catch (err) {
          failed += chunk.length
          const error = messageOf(err, "This file didn't upload.")
          setRows((list) => list.map((r) => (keys.includes(r.key) ? { ...r, state: 'error', error } : r)))
        }
      }
      return failed
    },
    [settleUploaded, sendLocalTitles],
  )

  const addFiles = useCallback(
    (files: File[]) => {
      const { accepted, problems: found } = checkNewFiles(files, rowsRef.current.length)
      setProblems(found)
      if (accepted.length === 0) return
      const added = accepted.map(pendingFileRow)
      setRows((list) => [...list, ...added])
      const id = itemRef.current
      if (id) void uploadRows(id, added)
    },
    [uploadRows],
  )

  const addLink = useCallback(async (title: string | null, url: string): Promise<string | null> => {
    if (rowsRef.current.length >= 20) return 'An item holds at most 20 attachments.'
    const id = itemRef.current
    if (!id) {
      setRows((list) => [...list, pendingLinkRow(title, url)])
      return null
    }
    try {
      const res = await apiAddLink(id, { title, url })
      setRows((list) => [...list, savedRow(res.data)])
      return null
    } catch (err) {
      return messageOf(err, "The link couldn't be added.")
    }
  }, [])

  const saveLink = useCallback(
    async (key: string, title: string | null, url: string): Promise<string | null> => {
      const row = rowsRef.current.find((r) => r.key === key)
      if (!row) return null
      if (!row.saved) {
        patchRow(key, () => pendingLinkRow(title, url, key))
        return null
      }
      try {
        const res = await updateAttachment(row.attachment.attachmentId, { title, url })
        patchRow(key, () => savedRow(res.data))
        return null
      } catch (err) {
        return messageOf(err, "The link couldn't be saved.")
      }
    },
    [patchRow],
  )

  const renameFile = useCallback(
    async (key: string, input: string): Promise<string | null> => {
      const row = rowsRef.current.find((r) => r.key === key)
      if (!row || row.attachment.kind !== 'file') return null
      const title = fileTitlePatch(input, row.attachment.fileName)
      if (!row.saved) {
        patchRow(key, (r) => ({ ...r, attachment: { ...r.attachment, title } }))
        return null
      }
      try {
        const res = await updateAttachment(row.attachment.attachmentId, { title })
        patchRow(key, () => savedRow(res.data))
        return null
      } catch (err) {
        return messageOf(err, "The name couldn't be saved.")
      }
    },
    [patchRow],
  )

  const replace = useCallback(
    (key: string, file: File) => {
      const row = rowsRef.current.find((r) => r.key === key)
      if (!row) return
      const { accepted, problems: found } = checkNewFiles([file], 0)
      setProblems(found)
      if (accepted.length === 0) return
      if (!row.saved) {
        if (row.localUrl) URL.revokeObjectURL(row.localUrl)
        const fresh = pendingFileRow(file)
        // A new file in place of one still waiting keeps the name given to it.
        patchRow(key, () => ({ ...fresh, key, attachment: { ...fresh.attachment, attachmentId: key, title: row.attachment.title } }))
        return
      }
      patchRow(key, (r) => ({ ...r, state: 'working', error: undefined }))
      replaceAttachmentFile(row.attachment.attachmentId, file).then(
        (res) => patchRow(key, () => savedRow(res.data)),
        (err: unknown) => patchRow(key, (r) => ({ ...r, state: 'error', error: messageOf(err, "The new file didn't upload.") })),
      )
    },
    [patchRow],
  )

  const remove = useCallback(
    (key: string) => {
      const row = rowsRef.current.find((r) => r.key === key)
      if (!row) return
      if (!row.saved) {
        if (row.localUrl) URL.revokeObjectURL(row.localUrl)
        setRows((list) => list.filter((r) => r.key !== key))
        return
      }
      patchRow(key, (r) => ({ ...r, state: 'working', error: undefined }))
      deleteAttachment(row.attachment.attachmentId).then(
        () => setRows((list) => list.filter((r) => r.key !== key)),
        (err: unknown) => patchRow(key, (r) => ({ ...r, state: 'error', error: messageOf(err, "It couldn't be removed.") })),
      )
    },
    [patchRow],
  )

  const sendPendingLink = useCallback(async (id: string, row: AttachmentEditorRow): Promise<boolean> => {
    patchRow(row.key, (r) => ({ ...r, state: 'working', error: undefined }))
    try {
      const res = await apiAddLink(id, { title: row.attachment.title, url: row.attachment.url ?? '' })
      patchRow(row.key, () => savedRow(res.data))
      return true
    } catch (err) {
      patchRow(row.key, (r) => ({ ...r, state: 'error', error: messageOf(err, "The link couldn't be added.") }))
      return false
    }
  }, [patchRow])

  const retry = useCallback(
    (key: string) => {
      const id = itemRef.current
      const row = rowsRef.current.find((r) => r.key === key)
      if (!id || !row || row.saved) return
      if (row.file) void uploadRows(id, [row])
      else void sendPendingLink(id, row)
    },
    [uploadRows, sendPendingLink],
  )

  const flush = useCallback(
    async (id: string): Promise<number> => {
      const waiting = rowsRef.current.filter((r) => !r.saved && r.state !== 'working')
      const files = waiting.filter((r) => r.file)
      const links = waiting.filter((r) => !r.file)
      let failed = await uploadRows(id, files)
      for (const link of links) if (!(await sendPendingLink(id, link))) failed += 1
      return failed
    },
    [uploadRows, sendPendingLink],
  )

  const resolveUrl = useCallback(async (row: AttachmentEditorRow): Promise<string> => {
    if (row.localUrl) return row.localUrl
    if (row.attachment.kind === 'link' || !row.saved) return row.attachment.url ?? ''
    return getAttachmentUrl(row.attachment.attachmentId)
  }, [])

  return {
    rows,
    problems,
    clearProblems: () => setProblems([]),
    pendingCount: rows.filter((r) => !r.saved).length,
    addFiles,
    addLink,
    saveLink,
    renameFile,
    replace,
    remove,
    retry,
    resolveUrl,
    flush,
  }
}

interface AttachmentsEditorProps {
  state: AttachmentsState
  label?: string
  optional?: boolean
  disabled?: boolean
}

export default function AttachmentsEditor({ state, label = 'Attachments', optional = false, disabled = false }: AttachmentsEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [addingLink, setAddingLink] = useState(false)
  const [previewing, setPreviewing] = useState<AttachmentEditorRow | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-slate-600">
        {label}
        {optional && <span className="font-normal text-slate-500"> (optional)</span>}
      </span>

      {state.rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {state.rows.map((row) =>
            editingKey === row.key ? (
              <LinkEditor
                key={row.key}
                mode={row.attachment.kind === 'file' ? 'rename' : 'edit'}
                initialTitle={row.attachment.title ?? ''}
                initialUrl={row.attachment.url ?? ''}
                fileName={row.attachment.fileName}
                onCancel={() => setEditingKey(null)}
                onSave={async (title, url) => {
                  const problem =
                    row.attachment.kind === 'file'
                      ? await state.renameFile(row.key, title ?? '')
                      : await state.saveLink(row.key, title, url)
                  if (!problem) setEditingKey(null)
                  return problem
                }}
              />
            ) : (
              <AttachmentRow
                key={row.key}
                row={row}
                disabled={disabled}
                onPreview={() => setPreviewing(row)}
                onReplace={(file) => state.replace(row.key, file)}
                onEdit={() => {
                  setAddingLink(false)
                  setEditingKey(row.key)
                }}
                onRemove={() => state.remove(row.key)}
                onRetry={() => state.retry(row.key)}
              />
            ),
          )}
        </div>
      )}

      {addingLink && (
        <LinkEditor
          mode="add"
          onCancel={() => setAddingLink(false)}
          onSave={async (title, url) => {
            const problem = await state.addLink(title, url)
            if (!problem) setAddingLink(false)
            return problem
          }}
        />
      )}

      {state.problems.length > 0 && (
        <ul role="alert" className="flex flex-col gap-0.5 text-xs text-rose-700">
          {state.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {state.rows.length > 0 && (
        <span className="text-xs text-slate-500">
          Preview opens PDFs, images and videos right here, without downloading. Students get the same viewer.
        </span>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              state.clearProblems()
              fileInput.current?.click()
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50/40"
          >
            <ArrowUpTrayIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingKey(null)
              setAddingLink(true)
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50/40"
          >
            <LinkIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Link or YouTube
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (files.length) state.addFiles(files)
            }}
          />
        </div>
      )}

      {previewing && (
        <AttachmentPreviewModal
          attachment={previewing.attachment}
          resolveUrl={() => state.resolveUrl(previewing)}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  )
}
