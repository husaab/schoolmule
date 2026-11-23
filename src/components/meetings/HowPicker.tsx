'use client'

// How a meeting happens: in person at the school, or a phone call, with the
// number the teacher calls. Used wherever a meeting is booked or changed:
// the parent's time picker, Change, Plan my visit, and the office's Board.

import React, { useId, useState } from 'react'
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { cleanPhone, type HowChoice } from '@/lib/meetings'
import { inputClass } from '@/components/shared/modalKit'

interface Props {
  value: HowChoice
  onChange: (value: HowChoice) => void
  /** Who calls: "Ms. Saleh will call you at this number." */
  teacherName?: string
  /** Where an in-person meeting is, when it's one room. */
  room?: string | null
  /** The parent pages are amber; the office's Board is cyan. */
  tone?: 'amber' | 'cyan'
  /** The office books for a family: "the family" rather than "you". */
  forOffice?: boolean
  /** Several meetings at once (Plan my visit). */
  plural?: boolean
}

const tones = {
  amber: { on: 'bg-white text-amber-800 shadow-sm ring-1 ring-amber-200', icon: 'text-amber-600' },
  cyan: { on: 'bg-white text-cyan-800 shadow-sm ring-1 ring-cyan-200', icon: 'text-cyan-600' },
}

const HowPicker: React.FC<Props> = ({ value, onChange, teacherName, room, tone = 'amber', forOffice = false, plural = false }) => {
  const id = useId()
  const [touched, setTouched] = useState(false)
  const t = tones[tone]
  const bad = value.mode === 'phone' && touched && value.phone.trim() !== '' && !cleanPhone(value.phone)
  const missing = value.mode === 'phone' && touched && value.phone.trim() === ''
  const caller = teacherName || (plural ? 'Each teacher' : 'The teacher')
  const option = (mode: HowChoice['mode'], label: string, Icon: typeof MapPinIcon) => (
    <button
      type="button"
      role="radio"
      aria-checked={value.mode === mode}
      onClick={() => onChange({ ...value, mode })}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${value.mode === mode ? t.on : 'text-slate-600 hover:text-slate-900'}`}
    >
      <Icon className={`h-4 w-4 ${value.mode === mode ? t.icon : 'text-slate-400'}`} aria-hidden="true" />
      {label}
    </button>
  )
  return (
    <div data-tour="meetings.how" className="space-y-2">
      <p id={`${id}-label`} className="text-sm font-medium text-slate-700">
        {forOffice ? 'How' : 'How would you like to meet?'}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex max-w-sm gap-1 rounded-xl border border-stone-200 bg-stone-100/70 p-1">
        {option('in_person', 'In person', MapPinIcon)}
        {option('phone', 'Phone call', PhoneIcon)}
      </div>
      {value.mode === 'in_person' ? (
        room ? <p className="text-xs text-slate-500">At the school, in the {room.replace(/^the /i, '')}.</p> : null
      ) : (
        <div className="max-w-sm">
          <label htmlFor={`${id}-phone`} className="mb-1 block text-xs font-medium text-slate-600">Number to call</label>
          <input
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="416-555-0100"
            className={inputClass}
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            onBlur={() => setTouched(true)}
            aria-invalid={bad || missing}
            aria-describedby={`${id}-hint`}
          />
          <p id={`${id}-hint`} className={`mt-1 text-xs ${bad || missing ? 'text-rose-600' : 'text-slate-500'}`}>
            {bad ? 'That doesn’t look like a full phone number.'
              : missing ? 'Enter the number to call.'
                : forOffice ? `${caller} will call the family at this number.`
                  : `${caller} will call you at this number at the meeting time.`}
          </p>
        </div>
      )}
    </div>
  )
}

export default HowPicker
