'use client'

// "Number I'll call from" for one set of meetings: what families who booked a
// phone call with this teacher see. Blank = the number in Settings, if any.
// A teacher can set it even when the office sets their hours.

import React, { useState } from 'react'
import { PhoneIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { badPhone, cleanPhone } from '@/lib/phone'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** The number set for these meetings (null = none). */
  callFrom: string | null
  /** The number in their Settings, used when callFrom is blank. */
  myPhone: string | null
  onSave: (callFrom: string | null) => Promise<void>
}

const CallFromModal: React.FC<Props> = ({ isOpen, onClose, callFrom, myPhone, onSave }) => {
  const [value, setValue] = useState('')
  const [openedFor, setOpenedFor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (isOpen && !openedFor) {
    setOpenedFor(true)
    setValue(callFrom ?? '')
    setError(null)
  }
  if (!isOpen && openedFor) setOpenedFor(false)
  const bad = badPhone(value)

  const save = async () => {
    if (bad) return
    setSaving(true)
    setError(null)
    try {
      await onSave(cleanPhone(value))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the number')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" ariaLabel="Number I'll call from">
      <ModalHeader title="Number I’ll call from" subtitle="Families who booked a phone call with you see it, so they know it’s you." icon={PhoneIcon} />
      <ModalBody>
        <Field
          label="Phone number"
          htmlFor="call-from"
          hint={bad ? 'That doesn’t look like a full phone number.'
            : myPhone ? `Leave it blank to use the number in your Settings (${myPhone}).`
              : 'Leave it blank and families won’t see a number.'}
        >
          <input
            id="call-from"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder={myPhone || '416-555-0100'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={bad}
          />
        </Field>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={bad} loading={saving} onClick={() => void save()}>Save</Button>
      </ModalFooter>
    </Modal>
  )
}

export default CallFromModal
