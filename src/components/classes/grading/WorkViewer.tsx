// src/components/classes/grading/WorkViewer.tsx
// What the student turned in (Teacher-Grading board): a photo fitted to the
// box (open full size, rotate, download), a PDF in place, other files listed
// to download, the typed answer, "Marked as done", or "Not turned in yet".
// Files are signed for an hour; one that no longer loads offers a reload.
'use client'

import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  DocumentIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { formatSize, previewKind } from '@/lib/attachments'
import type { SubmissionMode } from '@/services/types/classwork'
import type { SubmissionDetail, SubmissionFile } from '@/services/types/grading'

interface WorkViewerProps {
  detail: SubmissionDetail | null
  loading: boolean
  error: string | null
  onReload: () => void
  kind: 'assignment' | 'quiz'
  mode: SubmissionMode
  first: string
}

const kindOf = (f: SubmissionFile) => previewKind({ kind: 'file', mimeType: f.mimeType, fileName: f.fileName, youtubeId: null })

function Frame({ children, striped = false }: { children: React.ReactNode; striped?: boolean }) {
  return (
    <figure
      className={`m-0 flex min-h-[420px] flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 p-4 text-slate-600 lg:min-h-[520px] ${
        striped ? 'bg-[repeating-linear-gradient(45deg,#f8fafc_0_14px,#f1f5f9_14px_28px)]' : 'bg-white'
      }`}
    >
      {children}
    </figure>
  )
}

function ActionLink({ href, download, children }: { href: string; download?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={download}
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 font-medium text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
    >
      {children}
    </a>
  )
}

function FileView({ file, first, onReload }: { file: SubmissionFile; first: string; onReload: () => void }) {
  const [turns, setTurns] = useState(0)
  const [broken, setBroken] = useState(false)
  const kind = kindOf(file)

  if (!file.url || broken) {
    return (
      <Frame striped>
        <DocumentIcon className="h-11 w-11 text-slate-400" aria-hidden="true" />
        <figcaption className="text-center text-sm">
          {file.fileName}
          <br />
          <span className="text-[13px] text-slate-500">The link to this file has expired.</span>
        </figcaption>
        <button
          type="button"
          onClick={() => {
            setBroken(false)
            onReload()
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
          Load it again
        </button>
      </Frame>
    )
  }

  if (kind === 'image') {
    return (
      <Frame striped>
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex max-h-[600px] w-full flex-1 items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset */}
          <img
            src={file.url}
            alt={`${first}'s photo: ${file.fileName}`}
            onError={() => setBroken(true)}
            style={{ transform: `rotate(${turns * 90}deg)` }}
            className="max-h-[560px] max-w-full object-contain transition-transform duration-200"
          />
        </a>
        <figcaption className="flex flex-col items-center gap-1 text-center text-sm">
          <span className="text-slate-700">
            {first}&apos;s photo: {file.fileName}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-1 text-[13px] text-slate-500">
            <ActionLink href={file.url}>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Open full size
            </ActionLink>
            ·
            <button
              type="button"
              onClick={() => setTurns((t) => (t + 1) % 4)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 font-medium text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Rotate
            </button>
            ·
            <ActionLink href={file.url} download={file.fileName}>
              <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Download
            </ActionLink>
          </span>
        </figcaption>
      </Frame>
    )
  }

  if (kind === 'pdf') {
    return (
      <div className="flex flex-1 flex-col gap-2">
        <iframe
          src={file.url}
          title={`${first}'s file: ${file.fileName}`}
          className="min-h-[520px] w-full flex-1 rounded-2xl border border-slate-200 bg-white"
        />
        <div className="flex flex-wrap items-center gap-1 text-[13px] text-slate-500">
          <span className="mr-1 text-slate-700">{file.fileName}</span>·
          <ActionLink href={file.url}>
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Open full size
          </ActionLink>
          ·
          <ActionLink href={file.url} download={file.fileName}>
            <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </ActionLink>
        </div>
      </div>
    )
  }

  return (
    <Frame>
      <DocumentIcon className="h-11 w-11 text-slate-400" aria-hidden="true" />
      <figcaption className="text-center text-sm text-slate-700">
        {file.fileName}
        <br />
        <span className="text-[13px] text-slate-500">{formatSize(file.sizeBytes)} · opens in its own app</span>
      </figcaption>
      <ActionLink href={file.url} download={file.fileName}>
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
        Download
      </ActionLink>
    </Frame>
  )
}

export default function WorkViewer({ detail, loading, error, onReload, kind, mode, first }: WorkViewerProps) {
  const [selected, setSelected] = useState(0)

  if (!detail) {
    return (
      <Frame striped>
        {loading ? (
          <Spinner size="lg" />
        ) : (
          <>
            <p className="text-sm text-slate-600">{error || "The work couldn't be loaded."}</p>
            <button
              type="button"
              onClick={onReload}
              className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Try again
            </button>
          </>
        )}
      </Frame>
    )
  }

  if (kind === 'quiz') {
    return (
      <Frame striped>
        <DocumentIcon className="h-11 w-11 text-slate-400" aria-hidden="true" />
        <figcaption className="text-center text-sm">
          {first}&apos;s quiz answers show here once quizzes are switched on.
        </figcaption>
      </Frame>
    )
  }

  const turnedIn = Boolean(detail.row.turnedInAt)
  const files = detail.files
  const text = (detail.textAnswer ?? '').trim()
  const hasWork = files.length > 0 || (mode === 'text' && text !== '')
  const draftNote = !turnedIn && hasWork && (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
      Not turned in yet. This is {first}&apos;s work so far.
    </p>
  )

  if (mode === 'done' || mode === 'none' || !hasWork) {
    return (
      <Frame striped>
        {mode === 'none' ? (
          <>
            <DocumentIcon className="h-11 w-11 text-slate-400" aria-hidden="true" />
            <figcaption className="text-center text-sm">Nothing is turned in online for this one: it&apos;s done in class.</figcaption>
          </>
        ) : mode === 'done' && turnedIn ? (
          <>
            <CheckCircleIcon className="h-11 w-11 text-emerald-600" aria-hidden="true" />
            <figcaption className="text-center text-sm font-medium text-emerald-800">Marked as done</figcaption>
          </>
        ) : turnedIn ? (
          <>
            <CheckCircleIcon className="h-11 w-11 text-emerald-600" aria-hidden="true" />
            <figcaption className="text-center text-sm">Turned in, with nothing attached.</figcaption>
          </>
        ) : (
          <>
            <PhotoIcon className="h-11 w-11 text-slate-400" aria-hidden="true" />
            <figcaption className="text-center text-sm">Not turned in yet</figcaption>
          </>
        )}
      </Frame>
    )
  }

  if (mode === 'text') {
    return (
      <div className="flex flex-1 flex-col gap-2">
        {draftNote}
        <section className="min-h-[320px] flex-1 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-2 text-xs font-medium text-slate-500">{first}&apos;s answer</h3>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{detail.textAnswer}</p>
        </section>
      </div>
    )
  }

  const current = files[Math.min(selected, files.length - 1)]
  return (
    <div className="flex flex-1 flex-col gap-3">
      {draftNote}
      {current && <FileView key={current.fileId} file={current} first={first} onReload={onReload} />}
      {files.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${first}'s files`}>
          {files.map((f, i) => (
            <li key={f.fileId}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={f.fileId === current?.fileId}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition-colors ${
                  f.fileId === current?.fileId ? 'border-cyan-200 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {kindOf(f) === 'image' ? (
                  <PhotoIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <DocumentIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="max-w-[180px] truncate">{f.fileName}</span>
                <span className="text-slate-400">{formatSize(f.sizeBytes)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
