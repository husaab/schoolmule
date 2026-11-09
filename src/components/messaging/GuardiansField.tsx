'use client'

import React, { useState } from 'react'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button, inputClass, selectClass } from '@/components/shared/modalKit'
import { addGuardian, removeGuardian, updateGuardian } from '@/services/messagingService'
import type { GuardianInput, GuardiansResponse, StaffTargetGuardian } from '@/services/types/messaging'
import { useNotificationStore } from '@/store/useNotificationStore'
import { GUARDIAN_ACCESS_NOTE, GUARDIAN_STATUS_TEXT, guardianRelationOptions, guardianStatus, type GuardianStatus } from './formatters'

const STATUS_TEXT_CLASS: Record<GuardianStatus, string> = {
  account: 'text-emerald-700',
  invited: 'text-sky-700',
  none: 'text-amber-700',
  'no-email': 'text-slate-400',
}

const STATUS_DOT_CLASS: Record<GuardianStatus, string> = {
  account: 'bg-emerald-500',
  invited: 'bg-sky-500',
  none: 'bg-amber-500',
  'no-email': 'bg-slate-300',
}

const GuardianForm: React.FC<{
  initial?: StaffTargetGuardian
  busy: boolean
  onSave: (input: GuardianInput) => void
  onCancel: () => void
}> = ({ initial, busy, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [relation, setRelation] = useState(initial?.relation ?? 'Guardian')

  return (
    <form
      className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ name, email, relation })
      }}
    >
      <input aria-label="Guardian name" placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputClass} autoFocus />
      <input aria-label="Guardian email" placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} className={inputClass} />
      <select aria-label="Relation to the student" value={relation} onChange={(e) => setRelation(e.target.value)} className={selectClass}>
        {guardianRelationOptions(initial?.relation).map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">{GUARDIAN_ACCESS_NOTE}</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" className="!px-3 !py-1.5" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="!px-3 !py-1.5" loading={busy}>
          {initial ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

interface GuardiansFieldProps {
  studentId: string
  guardians: StaffTargetGuardian[]
  onChange: (guardians: StaffTargetGuardian[]) => void
}

/**
 * Who a staff message about this student will reach: name, account status and
 * email for each person, then a place to type in someone missing. A typed-in
 * guardian can be corrected or removed until the first message invites them.
 */
const GuardiansField: React.FC<GuardiansFieldProps> = ({ studentId, guardians, onChange }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // 'new', or the link id of the guardian being edited.
  const [form, setForm] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (call: () => Promise<GuardiansResponse>) => {
    setBusy(true)
    try {
      const res = await call()
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not save the guardian')
      onChange(res.data.guardians)
      setForm(null)
      setRemoving(null)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not save the guardian', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!studentId) {
    return <div className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-400">Pick a student</div>
  }

  return (
    <div className="space-y-2">
      <div id="nc-guardians" className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-600">
        {guardians.length > 0 ? (
          <ul className="space-y-2">
            {guardians.map((g) => {
              const status = guardianStatus(g)
              const id = g.linkId
              const key = id ?? g.email ?? ''
              const confirming = id !== null && removing === id
              if (id !== null && form === id) {
                return (
                  <li key={key}>
                    <GuardianForm initial={g} busy={busy} onCancel={() => setForm(null)} onSave={(input) => void run(() => updateGuardian(id, input))} />
                  </li>
                )
              }
              return (
                <li key={key} className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-700">
                      {g.name ?? 'Guardian'}
                      {g.relation ? ` (${g.relation})` : ''}
                    </p>
                    <p className={STATUS_TEXT_CLASS[status]}>{GUARDIAN_STATUS_TEXT[status]}</p>
                    {g.email && <p className="break-all text-slate-500">{g.email}</p>}
                    {confirming && (
                      <p className="mt-1 flex items-center gap-2 text-slate-700">
                        Remove them?
                        <button type="button" className="cursor-pointer font-medium text-slate-500 hover:text-slate-700" onClick={() => setRemoving(null)}>
                          Keep
                        </button>
                        <button type="button" disabled={busy} className="cursor-pointer font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50" onClick={() => void run(() => removeGuardian(id))}>
                          Remove
                        </button>
                      </p>
                    )}
                  </div>
                  {g.canEdit && id !== null && !confirming && (
                    <span className="flex shrink-0 gap-0.5">
                      <button type="button" aria-label={`Edit ${g.name ?? 'guardian'}`} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600" onClick={() => setForm(id)}>
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label={`Remove ${g.name ?? 'guardian'}`} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setRemoving(id)}>
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <span className="text-slate-500">No guardians on file. Add one so this message reaches someone.</span>
        )}
      </div>

      {form === 'new' ? (
        <GuardianForm busy={busy} onCancel={() => setForm(null)} onSave={(input) => void run(() => addGuardian(studentId, input))} />
      ) : (
        <button type="button" className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800" onClick={() => { setForm('new'); setRemoving(null) }}>
          <PlusIcon className="h-3.5 w-3.5" /> Add guardian
        </button>
      )}
    </div>
  )
}

export default GuardiansField
