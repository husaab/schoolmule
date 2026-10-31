// src/components/progress-report/generate/generateProgressReportModal.tsx
// Follows one Generate press on the progress reports page: a moving bar while
// the server builds the PDFs, then who got a report and who was skipped (and
// why), with a shortcut to email the families whose new report hasn't gone out.
'use client'

import { useEffect } from 'react'
import { CheckIcon, DocumentPlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { generateErrorText, type GenerateOutcome } from '@/lib/progressReportRoster'

interface Props {
  isOpen: boolean
  onClose: () => void
  running: boolean
  term: string
  /** The students this press covers, in list order. */
  students: { studentId: string; name: string }[]
  /** Set once the server answers. */
  outcome: GenerateOutcome | null
  /** The whole request failed (network, server error). */
  error: string | null
  /** Ids of students whose new report hasn't been emailed; offers "Email these families". */
  emailableIds: string[]
  onEmailFamilies: (studentIds: string[]) => void
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function GenerateProgressReportModal({ isOpen, onClose, running, term, students, outcome, error, emailableIds, onEmailFamilies }: Props) {
  // Leaving mid-run loses the result (the server keeps going), so ask first.
  useEffect(() => {
    if (!isOpen || !running) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isOpen, running])

  const nameOf = new Map(students.map((s) => [s.studentId, s.name]))
  const total = students.length
  const ok = outcome?.generated.length ?? 0
  const failed = outcome?.failed ?? []
  const close = () => {
    if (!running) onClose()
  }

  const header = running
    ? { title: `Generating ${plural(total, 'progress report', 'progress reports')}`, subtitle: term, tone: 'brand' as const, icon: DocumentPlusIcon }
    : error || ok === 0
      ? { title: 'No reports were generated', subtitle: error ?? term, tone: 'danger' as const, icon: ExclamationTriangleIcon }
      : failed.length > 0
        ? { title: `${ok} of ${total} reports ready`, subtitle: `${term}. ${plural(failed.length, 'student was', 'students were')} skipped.`, tone: 'warning' as const, icon: ExclamationTriangleIcon }
        : { title: `${plural(ok, 'progress report', 'progress reports')} ready`, subtitle: `${term}. They're in the list now.`, tone: 'success' as const, icon: CheckIcon }

  return (
    <Modal isOpen={isOpen} onClose={close} closeOnEscape={!running} style="w-full max-w-lg" ariaLabel={header.title}>
      <ModalHeader title={header.title} subtitle={header.subtitle} tone={header.tone} icon={header.icon} />
      {/* Screen readers hear the outcome when the run finishes. */}
      <p className="sr-only" role="status" aria-live="polite">
        {running ? '' : `${header.title}. ${header.subtitle ?? ''}`}
      </p>
      <ModalBody>
        {running && (
          <div className="space-y-2">
            <div
              role="progressbar"
              aria-label="Generating"
              className="h-2 w-full rounded-xl bg-[linear-gradient(90deg,#cffafe,#06b6d4,#14b8a6,#cffafe)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite] motion-reduce:animate-none"
            />
            <p className="text-sm text-slate-500">Keep this tab open until it finishes. A report that already exists for {term} is replaced.</p>
          </div>
        )}

        {failed.length > 0 && (
          <ul className="space-y-2">
            {failed.map((f) => (
              <li key={f.studentId || f.error} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                <p className="font-medium">{nameOf.get(f.studentId) ?? 'A student'}</p>
                <p className="mt-0.5">{generateErrorText(f.error, term)}</p>
              </li>
            ))}
          </ul>
        )}

        {!error && (
          <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
            {students
              .filter((s) => running || outcome?.generated.includes(s.studentId))
              .map((s) => (
                <li key={s.studentId} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span className="truncate text-slate-800">{s.name}</span>
                  {running ? <span className="text-slate-500">Waiting</span> : <span className="text-emerald-700">Generated</span>}
                </li>
              ))}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        {running ? (
          <Button variant="secondary" loading disabled>
            Generating
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
            {emailableIds.length > 0 && (
              <Button variant="primary" onClick={() => onEmailFamilies(emailableIds)}>
                Email {emailableIds.length === 1 ? 'this family' : `these ${emailableIds.length} families`}
              </Button>
            )}
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
