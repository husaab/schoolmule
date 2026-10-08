import { useCallback, useRef, useState } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ACCEPT_ATTR, MAX_FILES, fileProblem } from '@/components/messaging/formatters'

/** The Composer's file rules, lifted out so a form with other fields can own the file list. */
export function useAnnouncementFiles(existingCount = 0) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [files, setFiles] = useState<File[]>([])
  const fileInput = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (picked: FileList | null) => {
      if (!picked) return
      const incoming = Array.from(picked)
      setFiles((cur) => {
        const next = [...cur]
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
        return next
      })
      if (fileInput.current) fileInput.current.value = ''
    },
    [existingCount, showNotification],
  )
  // Stable identities: the composer's reset effect lists `reset` as a dependency.
  const removeFile = useCallback((f: File) => setFiles((cur) => cur.filter((x) => x !== f)), [])
  const reset = useCallback(() => setFiles([]), [])

  return {
    files,
    addFiles,
    removeFile,
    reset,
    fileInput,
    accept: ACCEPT_ATTR,
    full: files.length + existingCount >= MAX_FILES,
  }
}
