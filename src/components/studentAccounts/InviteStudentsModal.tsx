// src/components/studentAccounts/InviteStudentsModal.tsx
// Invite the selected students: review who will get an email, whose address
// to check and who is skipped (and why), preview the email, confirm parental
// consent, then send in small batches with progress. The server paces invite
// emails (~600 ms each), so one request for 200 students would hang for two
// minutes; batches keep each request short and let the modal count up.
'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { getInvitePreview, inviteStudents } from '@/services/studentAccountService'
import type { ClassroomSettings, InviteResult, StudentAccountRow } from '@/services/types/studentAccount'
import { INVITE_BATCH_SIZE, chunk, gradeLabel, groupInviteReview } from '@/lib/studentAccounts'
import { CheckCircleIcon, ExclamationTriangleIcon, EyeIcon, MinusCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

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
  // "Check these" rows the admin unticked (all are ticked to begin with).
  const [leftOut, setLeftOut] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<{ subject: string; html: string } | 'loading' | null>(null)

  const review = useMemo(() => groupInviteReview(rows, settings), [rows, settings])
  // The students the button sends: everyone ready, minus the checked ones left out.
  const ready = useMemo(
    () => [...review.send, ...review.check.filter((c) => !leftOut.has(c.row.studentId)).map((c) => c.row)],
    [review, leftOut],
  )
  const readyIds = useMemo(() => new Set(ready.map((r) => r.studentId)), [ready])
  const skipReason = useMemo(() => new Map(review.skipped.map((s) => [s.row.studentId, s.reason])), [review])
  // While sending and after: everyone, the ones being sent first.
  const ordered = useMemo(
    () => [...ready, ...rows.filter((r) => !readyIds.has(r.studentId))],
    [ready, rows, readyIds],
  )

  const togglePreview = async () => {
    if (preview) return setPreview(null)
    const first = ready[0] ?? review.check[0]?.row
    if (!first) return
    setPreview('loading')
    try {
      setPreview((await getInvitePreview(first.studentId)).data)
    } catch {
      setPreview(null)
    }
  }

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

  const rowNote = (row: StudentAccountRow) => {
    const result = results.get(row.studentId)
    if (result) {
      return result.outcome === 'invited'
        ? { tone: result.inviteSent === false ? 'warn' : 'ok', label: 'Invited', text: result.message }
        : { tone: 'skip', label: 'Skipped', text: result.message }
    }
    if (readyIds.has(row.studentId)) {
      return { tone: 'pending', label: phase === 'sending' ? 'Waiting' : 'Not sent', text: row.studentEmail ?? '' }
    }
    return { tone: 'skip', label: 'Skipped', text: skipReason.get(row.studentId) ?? 'Left out' }
  }

  const sectionTitle = 'text-sm font-semibold text-slate-800'
  const emailOf = (row: StudentAccountRow) => row.studentEmail ?? row.account?.email ?? ''

  return (
    <Modal isOpen={isOpen} onClose={close} style="w-full max-w-xl">
      <ModalHeader
        title={phase === 'done' ? 'Invites sent' : `Invite ${plural(rows.length, 'student', 'students')}`}
        subtitle={
          phase === 'done'
            ? `${invitedCount} invited · ${skippedCount} skipped`
            : 'Each student gets an email to set up their account. Links work once and expire after 14 days.'
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

        {phase === 'review' ? (
          <div className="max-h-[26rem] space-y-5 overflow-y-auto pr-1">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className={sectionTitle}>Will get an email ({review.send.length})</h3>
                {(review.send.length > 0 || review.check.length > 0) && (
                  <Button variant="secondary" onClick={() => void togglePreview()} loading={preview === 'loading'}>
                    <EyeIcon className="h-4 w-4" />
                    {preview && preview !== 'loading' ? 'Hide preview' : 'Preview email'}
                  </Button>
                )}
              </div>
              {preview && preview !== 'loading' && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">Subject:</span> {preview.subject}
                  </p>
                  {/* The server-rendered email, sandboxed: no scripts, no navigation. */}
                  <iframe title="Invite email preview" srcDoc={preview.html} sandbox="" className="h-80 w-full bg-white" />
                </div>
              )}
              {review.send.length === 0 ? (
                <p className="text-sm text-slate-500">Nobody yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {review.send.map((row) => (
                    <li key={row.studentId} className="px-3 py-2 text-sm">
                      <span className="font-medium text-slate-900">{row.name}</span>
                      <span className="text-slate-500"> · {gradeLabel(row.grade)} · {emailOf(row)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {review.check.length > 0 && (
              <section className="space-y-2">
                <h3 className={sectionTitle}>
                  Check these ({review.check.length}) <span className="font-normal text-slate-500">· untick to leave them out</span>
                </h3>
                <ul className="space-y-2">
                  {review.check.map(({ row, warnings }) => (
                    <li key={row.studentId}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={!leftOut.has(row.studentId)}
                          onChange={(e) =>
                            setLeftOut((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.delete(row.studentId)
                              else next.add(row.studentId)
                              return next
                            })
                          }
                          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="min-w-0">
                          <span className="font-medium text-slate-900">{row.name}</span>
                          <span className="text-slate-600"> · {gradeLabel(row.grade)} · {emailOf(row)}</span>
                          {warnings.map((w) => (
                            <span key={w.code} className="block text-xs text-amber-800">
                              {w.message}
                            </span>
                          ))}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {review.skipped.length > 0 && (
              <section className="space-y-2">
                <h3 className={sectionTitle}>Skipped ({review.skipped.length})</h3>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {review.skipped.map(({ row, reason }) => (
                    <li key={row.studentId} className="flex items-start gap-3 px-3 py-2 text-sm">
                      <MinusCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="font-medium text-slate-900">{row.name}</span>
                        <span className="text-slate-500"> · {gradeLabel(row.grade)}</span>
                        <span className="block text-xs text-slate-600">{reason}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
          {ordered.map((row) => {
            const note = rowNote(row)
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
                  <p className="text-xs text-slate-600">{note.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
        )}

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
              I confirm the school has a parent or guardian&apos;s consent for these students to use SchoolMule.
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
