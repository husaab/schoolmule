'use client'

// Review a student's account request: pick the student's existing record
// (the likeliest first, or search this year's list), check the address the
// invite goes to, confirm consent, then approve. Approving writes the address
// on the record and sends the normal student invite in one step; nothing is
// made if any part is refused.

import { FC, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, Field, FormSection, ModalBody, ModalFooter, ModalHeader, RecordFacts, inputClass } from '@/components/shared/modalKit'
import Spinner from '@/components/Spinner'
import { formatDate } from '@/components/adminUsers/userDisplay'
import { gradeLabel } from '@/lib/studentAccounts'
import { approveBlocker, blockingProblems, defaultStudentId, suggestionLabel } from '@/lib/studentRequests'
import { isApiError } from '@/services/apiClient'
import { approveStudentRequest, getRequestCandidates } from '@/services/studentRequestService'
import type { RequestCandidates, StudentRequest } from '@/services/types/studentRequest'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ExclamationCircleIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline'

interface Props {
  request: StudentRequest
  onClose: () => void
  onApproved: (requestId: string) => void
  /** The request changed elsewhere (approved or declined meanwhile): reload. */
  onStale: () => void
}

const SEARCH_RESULTS = 8

const StudentRequestReviewModal: FC<Props> = ({ request, onClose, onApproved, onStale }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [data, setData] = useState<RequestCandidates | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [email, setEmail] = useState(request.email)
  const [search, setSearch] = useState('')
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string | null>(null)
  // Bumped after a refusal, so the address's problems are checked again.
  const [recheck, setRecheck] = useState(0)
  const first = useRef(true)
  // The page's callbacks, read when needed so a page re-render never reloads the review.
  const leave = useRef({ onClose, onStale })
  leave.current = { onClose, onStale }

  // The review for the address and pick as they are now; typing waits a moment.
  useEffect(() => {
    let live = true
    setChecking(true)
    const timer = setTimeout(async () => {
      try {
        const res = await getRequestCandidates(request.requestId, { email: email.trim(), studentId: pickedId })
        if (!live) return
        setData(res.data)
        setLoadError(null)
        if (first.current) {
          first.current = false
          setStudentId(defaultStudentId(res.data.candidates))
        }
      } catch (err) {
        if (!live) return
        if (isApiError(err) && (err.status === 404 || err.code === 'REQUEST_NOT_PENDING')) {
          notify(err.message, 'error')
          leave.current.onStale()
          leave.current.onClose()
          return
        }
        setLoadError(err instanceof Error ? err.message : "Couldn't load the request")
      } finally {
        if (live) setChecking(false)
      }
    }, first.current ? 0 : 400)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [request.requestId, email, pickedId, recheck, notify])

  const selected = data?.candidates.find((c) => c.studentId === studentId) ?? null
  const problems = selected?.problems ?? []
  const blocker = approveBlocker({ studentId, email, consent, problems, checking: checking || (Boolean(studentId) && !selected) })

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || !data) return []
    return data.students.filter((s) => s.name.toLowerCase().includes(q)).slice(0, SEARCH_RESULTS)
  }, [search, data])

  const pick = (id: string) => {
    setStudentId(id)
    if (!data?.candidates.some((c) => c.studentId === id)) setPickedId(id)
    setSearch('')
    setRefusal(null)
  }

  const approve = async () => {
    if (!studentId || blocker || !data) return
    setSaving(true)
    setRefusal(null)
    try {
      const res = await approveStudentRequest(request.requestId, {
        studentId, email: email.trim(), consentConfirmed: true, noticeVersion: data.noticeVersion,
      })
      const { invite } = res.data
      notify(
        invite.inviteSent ? invite.message : 'Approved, but the invite email could not be sent. Resend it from Student accounts.',
        invite.inviteSent ? 'success' : 'error',
      )
      onApproved(request.requestId)
      onClose()
    } catch (err) {
      if (isApiError(err) && (err.code === 'REQUEST_NOT_PENDING' || err.status === 404)) {
        notify(err.message, 'error')
        onStale()
        onClose()
        return
      }
      setRefusal(err instanceof Error ? err.message : "Couldn't approve the request")
      setRecheck((n) => n + 1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} style="w-full max-w-xl">
      <ModalHeader
        title={`Review ${request.firstName}'s request`}
        subtitle="Match it to the student's record, then send the invite."
        icon={UserPlusIcon}
      />
      <ModalBody className="space-y-5">
        <RecordFacts
          facts={[
            { label: 'Typed name', value: request.name },
            { label: 'Typed grade', value: gradeLabel(request.grade) },
            { label: 'Typed email', value: request.email },
            { label: 'Asked', value: formatDate(request.createdAt) },
          ]}
        />

        {loadError ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">{loadError}</p>
        ) : !data ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <>
            <FormSection label="Which student is this?">
              {data.candidates.length === 0 && (
                <p className="text-sm text-slate-500">No one on this year&apos;s list has this name. Search for the student below.</p>
              )}
              <div className="space-y-2" role="radiogroup" aria-label="Student record">
                {data.candidates.map((c) => {
                  const active = c.studentId === studentId
                  return (
                    <label
                      key={c.studentId}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3.5 py-3 transition-colors ${
                        active ? 'border-cyan-500 bg-cyan-50/60' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="request-student"
                        checked={active}
                        onChange={() => pick(c.studentId)}
                        className="mt-1 h-4 w-4 cursor-pointer accent-cyan-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-slate-900">{c.name}</span>
                          <span className="text-sm text-slate-500">{gradeLabel(c.grade)}</span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                            {suggestionLabel(c.kind)}
                          </span>
                          {c.grade !== request.grade && (
                            <span className="text-[11px] text-amber-700">Grade differs from what they typed</span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {c.hasLogin ? 'Already has an account' : c.currentEmail ? `On file: ${c.currentEmail}` : 'No email on file'}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="relative mt-3">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Not listed? Search this year's students"
                  aria-label="Search this year's students"
                  className={`${inputClass} pl-9`}
                />
                {results.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {results.map((s) => (
                      <li key={s.studentId}>
                        <button
                          type="button"
                          onClick={() => pick(s.studentId)}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="text-slate-900">{s.name}</span>
                          <span className="text-xs text-slate-500">
                            {gradeLabel(s.grade)}{s.hasLogin ? ' · has an account' : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormSection>

            <Field label="Invite goes to" htmlFor="request-email" hint="Typed by the student and not verified. Fix it if it's wrong.">
              <input
                id="request-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setRefusal(null) }}
                className={inputClass}
              />
            </Field>

            {problems.length > 0 && (
              <ul className="space-y-1.5" aria-live="polite">
                {problems.map((p) => (
                  <li
                    key={p.code + p.message}
                    className={`flex items-start gap-2 rounded-xl px-3.5 py-2 text-sm ${
                      p.blocking ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    {p.blocking
                      ? <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                      : <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />}
                    <span>{p.message}</span>
                  </li>
                ))}
              </ul>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700">
                I confirm the school has a parent or guardian&apos;s consent for this student to use SchoolMule (notice{' '}
                {data.noticeVersion}).
              </span>
            </label>

            {refusal && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">{refusal}</p>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {data && blocker && !blockingProblems(problems).length && (
          <span className="mr-auto text-xs text-slate-500">{blocker}</span>
        )}
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => void approve()} disabled={Boolean(blocker) || !data} loading={saving}>
          Approve and send invite
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default StudentRequestReviewModal
