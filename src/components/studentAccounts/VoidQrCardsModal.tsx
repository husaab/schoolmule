// src/components/studentAccounts/VoidQrCardsModal.tsx
// Void the live QR sign-in cards of one or more students. A printed card
// stops working at once; printing again issues a new one.
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { voidQrCards } from '@/services/studentAccountService'
import type { StudentAccountRow } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { STUDENT_BATCH_LIMIT, chunk } from '@/lib/studentAccounts'
import { NoSymbolIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Students with an active QR card. */
  rows: StudentAccountRow[]
  onDone: () => void
}

const LISTED = 6

export default function VoidQrCardsModal({ isOpen, onClose, rows, onDone }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [voiding, setVoiding] = useState(false)
  const single = rows.length === 1 ? rows[0] : null

  const handleVoid = async () => {
    setVoiding(true)
    try {
      let voided = 0
      for (const batch of chunk(rows.map((r) => r.studentId), STUDENT_BATCH_LIMIT)) {
        const res = await voidQrCards(batch)
        voided += res.data.voided
      }
      notify(voided === 1 ? 'QR card voided' : `${voided} QR cards voided`, 'success')
      onDone()
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : "The QR cards couldn't be voided", 'error')
    } finally {
      setVoiding(false)
    }
  }

  const consequences = {
    title: 'What happens:',
    items: [
      single ? `${single.name}'s printed card stops working right away` : 'The printed cards stop working right away',
      single ? `Print a new card to give ${single.name} a working one` : 'Print new cards to give these students working ones',
      'A device already signed in with a card stays signed in until that session ends (at most 12 hours)',
    ],
  }

  return (
    <Modal isOpen={isOpen} onClose={voiding ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader
        title={single ? 'Void QR card' : `Void ${rows.length} QR cards`}
        subtitle="Email and password sign-in keep working."
        icon={NoSymbolIcon}
        tone="warning"
      />
      <ModalBody>
        <ConfirmBody tone="warning" consequences={consequences}>
          {single ? (
            <>
              Void the QR card for {single.name} (<strong className="font-semibold text-slate-900">{single.account?.email}</strong>)?
            </>
          ) : (
            <>Void the QR cards of these students?</>
          )}
        </ConfirmBody>
        {!single && (
          <ul className="space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {rows.slice(0, LISTED).map((r) => (
              <li key={r.studentId} className="truncate">
                {r.name} <span className="text-slate-400">· {r.account?.email}</span>
              </li>
            ))}
            {rows.length > LISTED && <li className="text-slate-500">and {rows.length - LISTED} more</li>}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={voiding}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handleVoid} loading={voiding}>
          {single ? 'Void QR card' : `Void ${rows.length} cards`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
