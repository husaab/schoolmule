// src/components/studentAccounts/PrintQrCardsModal.tsx
// The confirm before QR cards print. Printing issues a new card and voids the
// older one, so it says so plainly first (lib/studentAccounts#printQrConfirm).
// Used by the admin Student accounts page and the class People tab.
'use client'

import { useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import { printQrConfirm } from '@/lib/studentAccounts'
import { PrinterIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** The students whose cards will print. */
  names: string[]
  /** How many of them hold a card now; null when the page cannot tell. */
  withCards: number | null
  /** Prints. The modal stays open (and busy) until it settles, then closes. */
  onConfirm: () => Promise<void> | void
}

const LISTED = 6

export default function PrintQrCardsModal({ isOpen, onClose, names, withCards, onConfirm }: Props) {
  const [printing, setPrinting] = useState(false)
  const confirm = printQrConfirm(names, withCards)

  const handlePrint = async () => {
    setPrinting(true)
    try {
      await onConfirm()
    } finally {
      setPrinting(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={printing ? () => {} : onClose} style="w-full max-w-md">
      <ModalHeader title={confirm.title} subtitle="Email and password sign-in keep working." icon={PrinterIcon} tone="warning" />
      <ModalBody>
        <ConfirmBody tone="warning" consequences={confirm.consequences}>
          {confirm.warning}
        </ConfirmBody>
        {names.length > 1 && (
          <ul className="space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {names.slice(0, LISTED).map((name, i) => (
              <li key={`${i}:${name}`} className="truncate">
                {name}
              </li>
            ))}
            {names.length > LISTED && <li className="text-slate-500">and {names.length - LISTED} more</li>}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={printing}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handlePrint} loading={printing}>
          {confirm.confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
