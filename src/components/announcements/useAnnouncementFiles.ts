import { useRef, useState } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ACCEPT_ATTR, MAX_FILES, fileProblem } from '@/components/messaging/formatters'

/** The Composer's file rules, lifted out so a form with other fields can own the file list. */
export function useAnnouncementFiles(existingCount = 0) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [files, setFiles] = useState<File[]>([])
  const fileInput = useRef<HTMLInputElement>(null)

  const addFiles = (picked: FileList | null) => {
    if (!picked) return
    const next = [...files]
    for (const f of Array.from(picked)) {
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
    setFiles(next)
    if (fileInput.current) fileInput.current.value = ''
  }

  return {
    files,
    addFiles,
    removeFile: (f: File) => setFiles((cur) => cur.filter((x) => x !== f)),
    reset: () => setFiles([]),
    fileInput,
    accept: ACCEPT_ATTR,
    full: files.length + existingCount >= MAX_FILES,
  }
}
