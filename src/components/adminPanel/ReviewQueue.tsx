'use client'

// Review right on the admin panel: the people waiting for approval (or the
// students who asked for an account), one after another, oldest first, in
// the same review and decline modals the Approvals page uses. After each one
// the panel refreshes its counts; the queue closes when nobody is left.

import React, { useEffect, useRef, useState } from 'react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import Spinner from '@/components/Spinner'
import ApprovalReviewModal from '@/components/adminApprovals/ApprovalReviewModal'
import ApprovalDeclineModal from '@/components/adminApprovals/ApprovalDeclineModal'
import StudentRequestReviewModal from '@/components/adminApprovals/StudentRequestReviewModal'
import StudentRequestConfirmModal from '@/components/adminApprovals/StudentRequestConfirmModal'
import { getApprovals } from '@/services/adminApprovalService'
import { getStudentRequests } from '@/services/studentRequestService'
import type { ApprovalUser } from '@/services/types/adminApproval'
import type { StudentRequest } from '@/services/types/studentRequest'
import { splitRequests } from '@/lib/studentRequests'

export type ReviewQueueKind = 'signups' | 'studentRequests'

interface ReviewQueueProps {
  queue: ReviewQueueKind
  onClose: () => void
  /** Someone was approved or declined: the panel refreshes its counts. */
  onChanged: () => void
}

const oldestFirst = <T extends { createdAt: string }>(list: T[]): T[] =>
  [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

// The Approvals page's Pending list: not declined, email verified (approving
// an unverified signup is refused until they click their link).
const pendingSignups = (users: ApprovalUser[]) => oldestFirst(users.filter((u) => !u.isArchived && u.isVerified !== false))

const NOUN: Record<ReviewQueueKind, string> = { signups: 'signups', studentRequests: 'student requests' }

/** The frame for loading, a failed load, or nothing left. */
const Notice = ({ title, subtitle, body, onClose, retry }: { title: string; subtitle?: string; body: React.ReactNode; onClose: () => void; retry?: () => void }) => (
  <Modal isOpen onClose={onClose} size="sm" ariaLabel={title}>
    <ModalHeader title={title} subtitle={subtitle} icon={ShieldCheckIcon} />
    <ModalBody>{body}</ModalBody>
    <ModalFooter>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
      <Button onClick={onClose}>Close</Button>
    </ModalFooter>
  </Modal>
)

const ReviewQueue: React.FC<ReviewQueueProps> = ({ queue, onClose, onChanged }) => {
  const [signups, setSignups] = useState<ApprovalUser[] | null>(null)
  const [requests, setRequests] = useState<StudentRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)
  const [handled, setHandled] = useState(0)
  const [version, setVersion] = useState(0)
  // The review closes itself right after approving (or finding the request
  // already handled); that close means "next", not "stop".
  const advanced = useRef(false)

  useEffect(() => {
    let live = true
    const load =
      queue === 'signups'
        ? getApprovals().then((res) => live && setSignups(pendingSignups(res.data)))
        : getStudentRequests().then((res) => live && setRequests(oldestFirst(splitRequests(res.data.requests).pending)))
    load.catch((err: unknown) => live && setError(err instanceof Error ? err.message : `Couldn’t load the ${NOUN[queue]}`))
    return () => {
      live = false
    }
  }, [queue, version])

  const list = queue === 'signups' ? signups : requests

  // Everyone handled: nothing more to show. (`handled`, not just an empty
  // list, so a queue that was empty on arrival says so instead of vanishing.)
  useEffect(() => {
    if (handled > 0 && list?.length === 0) onClose()
  }, [handled, list, onClose])

  const closeReview = () => {
    if (advanced.current) advanced.current = false
    else onClose()
  }

  // Decline cancelled (or done: it closes itself after `next`): back to the review.
  const backToReview = () => {
    advanced.current = false
    setDeclining(false)
  }

  const reload = () => {
    setError(null)
    setDeclining(false)
    setVersion((v) => v + 1)
  }

  // Someone else handled the request meanwhile: fetch the queue again and stay open.
  const stale = () => {
    advanced.current = true
    onChanged()
    reload()
  }

  // The head of the queue was approved or declined: on to the next one.
  const next = () => {
    advanced.current = true
    onChanged()
    setDeclining(false)
    setHandled((n) => n + 1)
    if (queue === 'signups') setSignups((prev) => prev?.slice(1) ?? prev)
    else setRequests((prev) => prev?.slice(1) ?? prev)
  }

  if (error) return <Notice title="Couldn’t open the review" body={<p className="text-sm text-slate-700">{error}</p>} onClose={onClose} retry={reload} />

  if (!list)
    return (
      <Notice
        title={`Loading ${NOUN[queue]}`}
        body={
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        }
        onClose={onClose}
      />
    )

  // The last one was just handled: the effect above closes the queue.
  if (list.length === 0 && handled > 0) return null

  if (list.length === 0)
    return (
      <Notice
        title="Nothing left to review"
        subtitle="Someone may have handled these already."
        body={<p className="text-sm text-slate-700">The counts on the admin panel will catch up in a moment.</p>}
        onClose={() => {
          onChanged()
          onClose()
        }}
      />
    )

  if (queue === 'signups') {
    const user = signups![0]
    return declining ? (
      <ApprovalDeclineModal key={`decline-${user.userId}`} isOpen user={user} onClose={backToReview} onDeclined={next} />
    ) : (
      <ApprovalReviewModal key={user.userId} isOpen user={user} onClose={closeReview} onApproved={next} onDecline={() => setDeclining(true)} />
    )
  }

  const request = requests![0]
  return declining ? (
    <StudentRequestConfirmModal
      key={`decline-${request.requestId}`}
      action="decline"
      request={request}
      onClose={backToReview}
      onDone={next}
      onStale={reload}
    />
  ) : (
    <StudentRequestReviewModal
      key={request.requestId}
      request={request}
      onClose={closeReview}
      onApproved={next}
      onStale={stale}
      onDecline={() => setDeclining(true)}
    />
  )
}

export default ReviewQueue
