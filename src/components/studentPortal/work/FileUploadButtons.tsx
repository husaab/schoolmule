// src/components/studentPortal/work/FileUploadButtons.tsx
// "Take a photo" and "Upload a file" (Student-Assignment board): two big dashed
// buttons that open the phone camera or the file picker. Once the work holds a
// file they shrink to an "Add another" row. What was picked is handed over;
// checking, shrinking and uploading it is the card's job.
'use client'

import { useRef } from 'react'
import { ArrowUpTrayIcon, CameraIcon } from '@heroicons/react/24/outline'
import { SUBMISSION_ACCEPT } from '@/lib/submissionFiles'

interface FileUploadButtonsProps {
  onPick: (files: File[]) => void
  disabled?: boolean
  /** The work already holds a file: smaller buttons. */
  compact?: boolean
}

export default function FileUploadButtons({ onPick, disabled = false, compact = false }: FileUploadButtonsProps) {
  const camera = useRef<HTMLInputElement>(null)
  const picker = useRef<HTMLInputElement>(null)

  // Reset the input so choosing the same file again still fires.
  const handle = (input: HTMLInputElement) => {
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (files.length > 0) onPick(files)
  }

  const button = compact
    ? 'flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 px-3 py-2.5 text-sm font-medium text-indigo-800 transition-colors hover:bg-indigo-50'
    : 'flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-indigo-300 bg-[#f8faff] px-2.5 py-4 text-[15px] font-medium text-indigo-800 transition-colors hover:bg-indigo-50'
  const icon = compact ? 'h-5 w-5 text-indigo-600' : 'h-[26px] w-[26px] text-indigo-600'

  return (
    <div className={compact ? 'flex gap-2.5' : 'grid grid-cols-2 gap-2.5'}>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handle(e.currentTarget)}
      />
      <input
        ref={picker}
        type="file"
        accept={`${SUBMISSION_ACCEPT},image/*`}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handle(e.currentTarget)}
      />
      <button type="button" disabled={disabled} onClick={() => camera.current?.click()} className={`${button} disabled:cursor-not-allowed disabled:opacity-50`}>
        <CameraIcon className={icon} aria-hidden="true" />
        {compact ? 'Take another photo' : 'Take a photo'}
      </button>
      <button type="button" disabled={disabled} onClick={() => picker.current?.click()} className={`${button} disabled:cursor-not-allowed disabled:opacity-50`}>
        <ArrowUpTrayIcon className={icon} aria-hidden="true" />
        {compact ? 'Upload another file' : 'Upload a file'}
      </button>
    </div>
  )
}
