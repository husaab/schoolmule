'use client'

import React, { useState } from 'react'
import { LinkSlashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'

interface DisconnectQboModalProps {
  isOpen: boolean
  companyName: string | null
  onClose: () => void
  /** Resolves when done; rejects to keep the modal open. */
  onConfirm: (purge: boolean) => Promise<void>
}

const DisconnectQboModal: React.FC<DisconnectQboModalProps> = ({ isOpen, companyName, onClose, onConfirm }) => {
  const [purge, setPurge] = useState(false)
  const [busy, setBusy] = useState(false)

  const close = () => {
    if (busy) return
    setPurge(false)
    onClose()
  }

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm(purge)
      setPurge(false)
    } catch {
      // The caller already told the user; stay open so they can retry.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} size="md">
      <ModalHeader title="Disconnect QuickBooks?" subtitle={companyName ?? undefined} icon={LinkSlashIcon} tone="danger" />
      <ModalBody>
        <ConfirmBody
          consequences={{
            title: 'What happens',
            items: [
              'SchoolMule stops reading from QuickBooks. Nothing in QuickBooks changes.',
              purge
                ? 'The cached customers, invoices and payments are deleted from SchoolMule.'
                : 'The tuition grid keeps showing the last synced data until you reconnect.',
              'Families, students and contacts stay as they are.',
            ],
          }}
        >
          You can reconnect at any time.
        </ConfirmBody>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={purge}
            onChange={(e) => setPurge(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-400"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">Also clear cached QuickBooks data</span>
            <span className="block text-xs text-slate-500">Needed before linking this school to a different QuickBooks company.</span>
          </span>
        </label>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={close} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm} loading={busy}>
          {purge ? 'Disconnect and clear' : 'Disconnect'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DisconnectQboModal
