import { useCallback, useEffect, useRef, useState } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ACCEPT_ATTR, MAX_FILES, fileProblem } from '@/components/messaging/formatters'
import { prepareUploads } from '@/lib/uploadPrep'

/**
 * The Composer's file rules, lifted out so a form with other fields can own
 * the file list. Pictures are resized before the checks run (src/lib/
 * uploadPrep.ts), so a 12 MB phone photo goes up as a ~1 MB JPEG instead of
 * being refused; `preparing` is how many are still being resized (Post waits).
 */
export function useAnnouncementFiles(existingCount = 0) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [files, setFiles] = useState<File[]>([])
  const [preparing, setPreparing] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  // The list as it stands, so the checks run once (not inside a state updater) after the await.
  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])

  const addFiles = useCallback(
    async (picked: FileList | null) => {
      if (!picked) return
      const chosen = Array.from(picked)
      if (fileInput.current) fileInput.current.value = ''
      if (chosen.length === 0) return
      setPreparing((n) => n + chosen.length)
      let incoming: File[]
      try {
        incoming = await prepareUploads(chosen, 'attachment')
      } finally {
        setPreparing((n) => n - chosen.length)
      }
      const next = [...filesRef.current]
      for (const f of incoming) {
        if (next.length + existingCount >= MAX_FILES) {
          showNotification(`At most ${MAX_FILES} files per announcement`, 'error')
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
      filesRef.current = next
      setFiles(next)
    },
    [existingCount, showNotification],
  )
  // Stable identities: the composer's reset effect lists `reset` as a dependency.
  const removeFile = useCallback((f: File) => {
    filesRef.current = filesRef.current.filter((x) => x !== f)
    setFiles(filesRef.current)
  }, [])
  const reset = useCallback(() => {
    filesRef.current = []
    setFiles([])
  }, [])

  return {
    files,
    addFiles,
    removeFile,
    reset,
    fileInput,
    accept: ACCEPT_ATTR,
    /** Pictures still being resized; a post waits for them. */
    preparing,
    full: files.length + existingCount + preparing >= MAX_FILES,
  }
}
