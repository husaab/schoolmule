'use client'

// Set, move, retry or remove the day a draft publishes itself.

import React, { useEffect, useState } from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import { setScheduleGoLive } from '@/services/schedulePlannerService'
import type { ScheduleSummary } from '@/services/types/schedulePlanner'
import { formatDay, torontoToday } from '@/lib/bellTimes'

interface GoLiveDateModalProps {
  schedule: ScheduleSummary | null
  onClose: () => void
  onChanged: () => void
}

const GoLiveDateModal: React.FC<GoLiveDateModalProps> = ({ schedule, onClose, onChanged }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState<'save' | 'remove' | null>(null)

  useEffect(() => {
    if (schedule) setDate(schedule.goLiveOn ?? '')
  }, [schedule])

  const save = async (goLiveOn: string | null) => {
    if (!schedule) return
    setSaving(goLiveOn ? 'save' : 'remove')
    try {
      await setScheduleGoLive(schedule.scheduleId, goLiveOn)
      showNotification(goLiveOn ? `It goes live ${formatDay(goLiveOn)}.` : 'Go-live date removed.', 'success')
      onChanged()
      onClose()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not change the go-live date', 'error')
    } finally {
      setSaving(null)
    }
  }

  const failed = schedule?.goLiveStatus === 'failed'

  return (
    <Modal isOpen={!!schedule} onClose={onClose} style="w-full max-w-md" closeOnEscape ariaLabel="Go-live date">
      <ModalHeader
        title={failed ? 'Go-live failed' : 'Go-live date'}
        icon={CalendarDaysIcon}
        tone={failed ? 'warning' : 'brand'}
        subtitle={schedule?.name}
      />
      <ModalBody>
        {failed && schedule?.goLiveError && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            It didn&apos;t publish: {schedule.goLiveError}. Fix that, then save a date to try again.
          </p>
        )}
        <Field
          label="Goes live on"
          htmlFor="go-live-date"
          hint="It publishes itself just after midnight that day (Toronto time)."
        >
          <input
            id="go-live-date"
            type="date"
            min={torontoToday()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      </ModalBody>
      <ModalFooter>
        {schedule?.goLiveOn && (
          <Button variant="secondary" className="mr-auto" onClick={() => save(null)} loading={saving === 'remove'}>
            Remove date
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => save(date)} disabled={!date || saving !== null} loading={saving === 'save'}>
          {failed ? 'Try again' : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default GoLiveDateModal
