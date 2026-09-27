'use client'

// A yes/no confirmation for destructive finance actions (delete a family,
// unlink a customer, remove a student or contact). The action's error is
// shown inside the modal, which stays open so the admin can retry.

import React, { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { errorMessage } from './format'

export interface ConfirmRequest {
  title: string
  subtitle?: string
  message: React.ReactNode
  consequences?: { title: string; items: string[] }
  confirmLabel: string
  tone?: 'danger' | 'warning'
  icon?: React.ComponentType<{ className?: string }>
  /** Rejects to keep the modal open; the error message is shown inline. */
  onConfirm: () => Promise<void>
}

interface ConfirmActionModalProps {
  request: ConfirmRequest | null
  onClose: () => void
}

function ConfirmContent({ request, onClose }: { request: ConfirmRequest; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tone = request.tone ?? 'danger'

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await request.onConfirm()
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ModalHeader title={request.title} subtitle={request.subtitle} icon={request.icon ?? ExclamationTriangleIcon} tone={tone} />
      <ModalBody>
        <ConfirmBody consequences={request.consequences} tone={tone}>
          {request.message}
        </ConfirmBody>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'warning'} onClick={confirm} loading={busy}>
          {request.confirmLabel}
        </Button>
      </ModalFooter>
    </>
  )
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ request, onClose }) => {
  // Keep the last request on screen while the modal animates closed.
  const [shown, setShown] = useState<ConfirmRequest | null>(request)
  const [seq, setSeq] = useState(0)
  if (request && request !== shown) {
    setShown(request)
    setSeq((n) => n + 1)
  }

  return (
    <Modal isOpen={!!request} onClose={onClose} size="md">
      {shown && <ConfirmContent key={seq} request={shown} onClose={onClose} />}
    </Modal>
  )
}

export default ConfirmActionModal
