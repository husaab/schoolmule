'use client'

import { useEffect, useRef, useState } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { prepareUploads } from '@/lib/uploadPrep'
import { MAX_FILES, fileProblem } from './formatters'

/**
 * Files picked for a message: pictures resized, every file checked with the
 * server's rules, and the list capped so that with `alreadyAttached` files the
 * message stays within MAX_FILES.
 */
export function usePickedFiles(alreadyAttached = 0) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [files, setFiles] = useState<File[]>([])
  const [preparing, setPreparing] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  // The list as it stands after the resize's await (the render's values may be stale by then).
  const latest = useRef({ files, alreadyAttached })
  useEffect(() => {
    latest.current = { files, alreadyAttached }
  }, [files, alreadyAttached])

  const addFiles = async (picked: FileList | null) => {
    if (!picked) return
    const chosen = Array.from(picked)
    if (fileInput.current) fileInput.current.value = ''
    if (chosen.length === 0) return
    setPreparing((n) => n + chosen.length)
    let ready: File[]
    try {
      ready = await prepareUploads(chosen, 'attachment')
    } finally {
      setPreparing((n) => n - chosen.length)
    }
    const next = [...latest.current.files]
    for (const f of ready) {
      if (next.length + latest.current.alreadyAttached >= MAX_FILES) {
        showNotification(`At most ${MAX_FILES} files per message`, 'error')
        break
      }
      const problem = fileProblem(f)
      if (problem) {
        showNotification(problem, 'error')
        continue
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue
      next.push(f)
    }
    latest.current.files = next
    setFiles(next)
  }

  return { files, setFiles, preparing, fileInput, addFiles }
}
