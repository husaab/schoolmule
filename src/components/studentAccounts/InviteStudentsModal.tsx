// src/components/studentAccounts/InviteStudentsModal.tsx
// Invite the selected students: review who is ready, confirm parental
// consent, then send in small batches with progress. The server paces invite
// emails (~600 ms each), so one request for 200 students would hang for two
// minutes; batches keep each request short and let the modal count up.
'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { inviteStudents } from '@/services/studentAccountService'
import type { ClassroomSettings, InviteResult, StudentAccountRow } from '@/services/types/studentAccount'
import { INVITE_BATCH_SIZE, chunk, inviteReadiness } from '@/lib/studentAccounts'
import { CheckCircleIcon, ExclamationTriangleIcon, MinusCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

// Mount it fresh for each invite run (the page renders it only while open),
// so every run starts at the review step with consent unticked.
interface Props {
  isOpen: boolean
  onClose: () => void
  rows: StudentAccountRow[]
  settings: ClassroomSettings
  /** Called once when the modal closes after anything was sent. */
  onDone: () => void
}

type Phase = 'review' | 'sending' | 'done'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function InviteStudentsModal({ isOpen, onClose, rows, settings, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('review')
  const [consent, setConsent] = useState(false)
  const [results, setResults] = useState<Map<string, InviteResult>>(new Map())
  const [sent, setSent] = useState(0)
  const [failure, setFailure] = useState<string | null>(null)

  // Ready students first: they are the ones the button sends.
  const readiness = useMemo(
    () =>
      rows
        .map((row) => ({ row, readiness: inviteReadiness(row, settings) }))
        .sort((a, b) => Number(b.readiness.ready) - Number(a.readiness.ready)),
    [rows, settings],
  )
  const ready = readiness.filter((r) => r.readiness.ready).map((r) => r.row)

  // Leaving the page mid-run would strand the remaining batches.
  useEffect(() => {
    if (phase !== 'sending') return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  const send = async () => {
    setPhase('sending')
    setFailure(null)
    const batches = chunk(ready.map((r) => r.studentId), INVITE_BATCH_SIZE)
    const collected = new Map<string, InviteResult>()
    let done = 0
    for (let i = 0; i < batches.length; i += 1) {
      try {
        const res = await inviteStudents(batches[i], settings.consentNoticeVersion)
        for (const result of res.data.results) collected.set(result.studentId, result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setFailure(message)
        // This batch and every later one were not sent.
        for (const id of batches.slice(i).flat()) {
          collected.set(id, { studentId: id, outcome: 'skipped', reason: null, message: `Not sent: ${message}` })
        }
        break
      }
      done += batches[i].length
      setSent(done)
      setResults(new Map(collected))
    }
    setResults(new Map(collected))
    setPhase('done')
  }

  const close = () => {
    if (phase === 'sending') return
    if (phase === 'done') onDone()
    onClose()
  }

  const invitedCount = [...results.values()].filter((r) => r.outcome === 'invited').length
  const skippedCount = rows.length - invitedCount
  const progress = ready.length > 0 ? Math.round((sent / ready.length) * 100) : 0

  const rowNote = (row: StudentAccountRow, note: string, isReady: boolean) => {
    const result = results.get(row.studentId)
    if (result) {
      return result.outcome === 'invited'
        ? { tone: result.inviteSent === false ? 'warn' : 'ok', label: 'Invited', text: result.message }
        : { tone: 'skip', label: 'Skipped', text: result.message }
    }
    if (phase === 'review') return { tone: isReady ? 'ok' : 'skip', label: isReady ? 'Ready' : 'Not ready', text: note }
    if (isReady) return { tone: 'pending', label: phase === 'sending' ? 'Waiting' : 'Not sent', text: note }
    return { tone: 'skip', label: 'Skipped', text: note }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} style="w-full max-w-xl">
      <ModalHeader
        title={phase === 'done' ? 'Invites sent' : `Invite ${plural(rows.length, 'student', 'students')}`}
        subtitle={
          phase === 'done'
            ? `${invitedCount} invited · ${skippedCount} skipped`
            : 'Each student gets an email to choose a password. The link lasts 7 days.'
        }
        icon={PaperAirplaneIcon}
      />

      <ModalBody>
        {phase === 'sending' && (
          <div role="status" aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Inviting… {sent} of {ready.length} sent
              </span>
              <span className="tabular-nums text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Keep this window open until every invite is sent.</p>
          </div>
        )}

        {failure && (
          <div role="alert" className="flex gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-900">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Sending stopped: {failure}. The students marked &ldquo;Not sent&rdquo; can be invited again.
            </span>
          </div>
        )}

        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
          {readiness.map(({ row, readiness: r }) => {
            const note = rowNote(row, r.note, r.ready)
            const Icon = note.tone === 'ok' ? CheckCircleIcon : note.tone === 'warn' ? ExclamationTriangleIcon : MinusCircleIcon
            const iconTone =
              note.tone === 'ok' ? 'text-emerald-500' : note.tone === 'warn' ? 'text-amber-500' : note.tone === 'pending' ? 'text-slate-300' : 'text-slate-400'
            return (
              <li key={row.studentId} className="flex items-start gap-3 px-3 py-2.5">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">{row.name}</span>
                    <span className="shrink-0 text-xs font-medium text-slate-500">{note.label}</span>
                  </div>
                  <p className={`text-xs ${note.tone === 'skip' && phase === 'review' ? 'text-slate-500' : 'text-slate-600'}`}>
                    {note.text}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        {phase === 'review' && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-slate-700">
              I confirm the school has a parent or guardian&apos;s consent for these students to use SchoolMule (notice{' '}
              {settings.consentNoticeVersion}).
            </span>
          </label>
        )}
      </ModalBody>

      <ModalFooter>
        {phase === 'review' && (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={() => void send()} disabled={!consent || ready.length === 0}>
              <PaperAirplaneIcon className="h-4 w-4" />
              Invite {plural(ready.length, 'student', 'students')}
            </Button>
          </>
        )}
        {phase === 'sending' && (
          <Button disabled loading>
            Sending {sent} of {ready.length}
          </Button>
        )}
        {phase === 'done' && <Button onClick={close}>Done</Button>}
      </ModalFooter>
    </Modal>
  )
}
