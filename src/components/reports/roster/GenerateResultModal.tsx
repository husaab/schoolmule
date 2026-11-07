// src/components/reports/roster/GenerateResultModal.tsx
// What a report roster's finished generation made (progress reports or
// report cards): who was skipped and why, then who got a report, with a
// shortcut to email the families whose new report hasn't gone out. Opened
// from the generation card's See details; the printing itself happens on
// the server, so nothing here waits.
'use client'

import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { generateErrorText, type GenerateOutcome } from '@/lib/reportRoster'
import type { ReportDoc } from '../reportDocs'

interface Props {
  doc: ReportDoc
  isOpen: boolean
  onClose: () => void
  term: string
  /** Student names by id. */
  names: Map<string, string>
  outcome: GenerateOutcome
  /** Ids of students whose new report hasn't been emailed; offers "Email these families". */
  emailableIds: string[]
  onEmailFamilies: (studentIds: string[]) => void
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function GenerateResultModal({ doc, isOpen, onClose, term, names, outcome, emailableIds, onEmailFamilies }: Props) {
  const ok = outcome.generated.length
  const failed = outcome.failed
  const total = ok + failed.length
  const nameOf = (id: string) => names.get(id) ?? 'A student'

  const header =
    ok === 0
      ? { title: `No ${doc.nouns} were generated`, subtitle: term, tone: 'danger' as const, icon: ExclamationTriangleIcon }
      : failed.length > 0
        ? { title: `${ok} of ${total} ${doc.nouns} ready`, subtitle: `${term}. ${plural(failed.length, 'student was', 'students were')} skipped.`, tone: 'warning' as const, icon: ExclamationTriangleIcon }
        : { title: `${plural(ok, doc.noun, doc.nouns)} ready`, subtitle: `${term}. They're in the list now.`, tone: 'success' as const, icon: CheckIcon }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg" ariaLabel={header.title}>
      <ModalHeader title={header.title} subtitle={header.subtitle} tone={header.tone} icon={header.icon} />
      <ModalBody>
        {failed.length > 0 && (
          <ul className="space-y-2">
            {failed.map((f) => (
              <li key={f.studentId || f.error} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                <p className="font-medium">{nameOf(f.studentId)}</p>
                <p className="mt-0.5">{generateErrorText(f.error, term)}</p>
              </li>
            ))}
          </ul>
        )}

        {ok > 0 && (
          <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
            {[...outcome.generated]
              .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
              .map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span className="truncate text-slate-800">{nameOf(id)}</span>
                  <span className="text-emerald-700">Generated</span>
                </li>
              ))}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
        {emailableIds.length > 0 && (
          <Button variant="primary" onClick={() => onEmailFamilies(emailableIds)}>
            Email {emailableIds.length === 1 ? 'this family' : `these ${emailableIds.length} families`}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
