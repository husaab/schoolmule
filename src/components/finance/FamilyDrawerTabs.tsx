'use client'

// The editable tabs of the family drawer: Students, Contacts and Notes.
// Each change goes straight to the server; the drawer reloads the family
// (and the page reloads the grid) through the `onChanged` callback.

import React, { useId, useMemo, useState } from 'react'
import {
  EnvelopeIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UserGroupIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Button, Field, FieldRow, inputClass, selectClass, textareaClass } from '@/components/shared/modalKit'
import PersonCombobox, { type ComboOption } from '@/components/relation/PersonCombobox'
import EmptyState from '@/components/ui/EmptyState'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  addFamilyContact,
  addFamilyStudent,
  deleteFamilyContact,
  getFamilySuggestions,
  removeFamilyStudent,
  updateFamily,
  updateFamilyContact,
} from '@/services/financeService'
import type { ContactInput, FamilyContact, FamilyDetail } from '@/services/types/finance'
import type { ConfirmRequest } from './ConfirmActionModal'
import MenuButton from './MenuButton'
import { RELATION_OPTIONS, amountText, looksLikeEmail, outlineButton, parseAmount, relationLabel } from './familyUi'
import { compareGrades, errorMessage, financeErrorText, formatDate, gradeShort } from './format'

interface TabProps {
  detail: FamilyDetail
  onChanged: () => void
  confirm: (request: ConfirmRequest) => void
}

const errorBox = 'rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700'

// ── Students ─────────────────────────────────────────────────────────────

export function StudentsTab({ detail, onChanged, confirm }: TabProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const familyId = detail.family.familyId
  const [adding, setAdding] = useState(false)
  const [pool, setPool] = useState<ComboOption[] | null>(null)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ComboOption | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startAdding = async () => {
    setAdding(true)
    setError(null)
    if (pool) return
    try {
      const res = await getFamilySuggestions()
      setPool(
        [...res.data.studentsWithoutFamily]
          .sort((a, b) => compareGrades(a.grade, b.grade) || a.name.localeCompare(b.name))
          .map((st) => ({ id: st.studentId, primary: st.name, secondary: gradeShort(st.grade) }))
      )
      setPoolError(null)
    } catch (err) {
      setPoolError(errorMessage(err, 'Could not load students without a family'))
      setPool([])
    }
  }

  const add = async () => {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await addFamilyStudent(familyId, selected.id)
      showNotification(`${selected.primary} added to ${detail.family.name}`, 'success')
      setPool((p) => p?.filter((o) => o.id !== selected.id) ?? p)
      setSelected(null)
      setAdding(false)
      onChanged()
    } catch (err) {
      setError(financeErrorText(err, 'Could not add the student'))
    } finally {
      setBusy(false)
    }
  }

  const remove = (studentId: string, name: string) =>
    confirm({
      title: `Remove ${name}?`,
      subtitle: detail.family.name,
      icon: UserMinusIcon,
      message: `${name} will no longer belong to ${detail.family.name}. The student record itself is not changed.`,
      confirmLabel: 'Remove student',
      onConfirm: async () => {
        await removeFamilyStudent(familyId, studentId)
        showNotification(`${name} removed from ${detail.family.name}`, 'success')
        onChanged()
      },
    })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!adding && (
          <button type="button" onClick={startAdding} className={outlineButton}>
            <PlusIcon className="h-3.5 w-3.5" />
            Add student
          </button>
        )}
      </div>

      {adding && (
        <div className="space-y-2 rounded-xl border border-cyan-100 bg-white p-3">
          <PersonCombobox
            options={pool ?? []}
            selected={selected}
            onSelect={setSelected}
            onClear={() => setSelected(null)}
            placeholder="Search students without a family…"
            loading={pool === null}
            searchKeys={(o) => `${o.primary} ${o.secondary ?? ''}`}
          />
          {poolError && <p className="text-xs text-amber-700">{poolError}</p>}
          {error && <p className={errorBox}>{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false)
                setSelected(null)
                setError(null)
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={add} loading={busy} disabled={!selected}>
              Add to family
            </Button>
          </div>
        </div>
      )}

      {detail.students.length === 0 ? (
        <EmptyState icon={UserGroupIcon} title="No students in this family" description="Add this family’s children so their tuition lines up." />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
          {detail.students.map((st) => (
            <li key={st.studentId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${st.isArchived ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{st.name}</p>
                <p className="text-xs text-slate-500">Added {formatDate(st.addedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {st.isArchived && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">Archived</span>}
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">{gradeShort(st.grade)}</span>
                <button
                  type="button"
                  onClick={() => remove(st.studentId, st.name)}
                  aria-label={`Remove ${st.name} from the family`}
                  title="Remove from family"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Contacts ─────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = { roster: 'From roster', student_record: 'From student record', manual: 'Added manually' }

function ContactForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  lockPrimary = false,
}: {
  initial: ContactInput
  submitLabel: string
  /** Already the primary contact: primary can only move by picking another. */
  lockPrimary?: boolean
  onSubmit: (input: ContactInput) => Promise<void>
  onCancel: () => void
}) {
  const id = useId()
  const [name, setName] = useState(initial.name ?? '')
  const [email, setEmail] = useState(initial.email ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [relation, setRelation] = useState(initial.relation ?? '')
  const [isPrimary, setIsPrimary] = useState(initial.isPrimary ?? false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() && !email.trim()) {
      setError('Enter a name or an email.')
      return
    }
    if (email.trim() && !looksLikeEmail(email.trim())) {
      setError('That doesn’t look like an email address.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        relation: relation || null,
        // Never send isPrimary: false — primary moves by setting another contact.
        ...(isPrimary ? { isPrimary: true } : {}),
      })
    } catch (err) {
      setError(errorMessage(err, 'Could not save the contact'))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-cyan-100 bg-white p-4">
      <FieldRow>
        <Field label="Name" htmlFor={`${id}-name`}>
          <input id={`${id}-name`} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Relation" htmlFor={`${id}-rel`}>
          <select id={`${id}-rel`} className={selectClass} value={relation} onChange={(e) => setRelation(e.target.value)}>
            <option value="">—</option>
            {RELATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email" htmlFor={`${id}-email`}>
          <input id={`${id}-email`} type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor={`${id}-phone`}>
          <input id={`${id}-phone`} type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </FieldRow>
      <div>
        <label className={`flex items-center gap-2 text-sm text-slate-700 ${lockPrimary ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={lockPrimary || isPrimary}
            disabled={lockPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-60"
          />
          Primary contact
        </label>
        {lockPrimary && <p className="mt-1 pl-6 text-xs text-slate-400">Make another contact primary to change this.</p>}
      </div>
      {error && <p className={errorBox}>{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function ContactsTab({ detail, onChanged, confirm }: TabProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const familyId = detail.family.familyId
  // 'new' for the add form, a contactId for an inline edit, null otherwise.
  const [editing, setEditing] = useState<string | null>(null)

  const contacts = useMemo(
    () => [...detail.contacts].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.name ?? '').localeCompare(b.name ?? '')),
    [detail.contacts]
  )

  const label = (c: FamilyContact) => c.name || c.email || 'this contact'

  const makePrimary = async (c: FamilyContact) => {
    try {
      await updateFamilyContact(familyId, c.contactId, { isPrimary: true })
      showNotification(`${label(c)} is now the primary contact`, 'success')
      onChanged()
    } catch (err) {
      showNotification(errorMessage(err, 'Could not update the contact'), 'error')
    }
  }

  const remove = (c: FamilyContact) =>
    confirm({
      title: `Delete ${label(c)}?`,
      subtitle: detail.family.name,
      icon: TrashIcon,
      message: c.hasAccount
        ? 'The contact is removed from this family. Their SchoolMule parent account is not deleted.'
        : 'The contact is removed from this family.',
      confirmLabel: 'Delete contact',
      onConfirm: async () => {
        await deleteFamilyContact(familyId, c.contactId)
        showNotification('Contact deleted', 'success')
        onChanged()
      },
    })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className={outlineButton}>
            <PlusIcon className="h-3.5 w-3.5" />
            Add contact
          </button>
        )}
      </div>

      {editing === 'new' && (
        <ContactForm
          initial={{ isPrimary: detail.contacts.length === 0 }}
          submitLabel="Add contact"
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            await addFamilyContact(familyId, input)
            showNotification('Contact added', 'success')
            setEditing(null)
            onChanged()
          }}
        />
      )}

      {contacts.length === 0 && editing !== 'new' ? (
        <EmptyState icon={UsersIcon} title="No contacts" description="Add the parents who pay this family’s tuition." />
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) =>
            editing === c.contactId ? (
              <li key={c.contactId}>
                <ContactForm
                  initial={{ name: c.name, email: c.email, phone: c.phone, relation: c.relation, isPrimary: c.isPrimary }}
                  submitLabel="Save contact"
                  lockPrimary={c.isPrimary}
                  onCancel={() => setEditing(null)}
                  onSubmit={async (input) => {
                    const patch: ContactInput = {}
                    if (input.name !== c.name) patch.name = input.name
                    if (input.email !== c.email) patch.email = input.email
                    if (input.phone !== c.phone) patch.phone = input.phone
                    if ((input.relation ?? null) !== (c.relation ?? null)) patch.relation = input.relation
                    if (input.isPrimary && !c.isPrimary) patch.isPrimary = true
                    if (Object.keys(patch).length > 0) {
                      await updateFamilyContact(familyId, c.contactId, patch)
                      showNotification('Contact saved', 'success')
                      onChanged()
                    }
                    setEditing(null)
                  }}
                />
              </li>
            ) : (
              <li key={c.contactId} className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.isPrimary && <StarIcon className="h-4 w-4 fill-amber-400 text-amber-500" aria-label="Primary contact" />}
                    <p className="text-sm font-medium text-slate-900">{c.name || 'Unnamed contact'}</p>
                    {c.relation && <span className="text-xs text-slate-500">· {relationLabel(c.relation)}</span>}
                    {c.hasAccount && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                        Has account
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-cyan-700 hover:underline">
                        <EnvelopeIcon className="h-3.5 w-3.5" />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-slate-600 hover:underline">
                        <PhoneIcon className="h-3.5 w-3.5" />
                        {c.phone}
                      </a>
                    )}
                    <span className="text-slate-400">{SOURCE_LABEL[c.source] ?? c.source}</span>
                  </div>
                </div>
                <MenuButton
                  label={`Options for ${label(c)}`}
                  triggerClassName="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  items={[
                    { key: 'edit', label: 'Edit', icon: PencilSquareIcon, onSelect: () => setEditing(c.contactId) },
                    ...(c.isPrimary ? [] : [{ key: 'primary', label: 'Set as primary', icon: StarIcon, onSelect: () => makePrimary(c) }]),
                    { key: 'delete', label: 'Delete', icon: TrashIcon, danger: true, onSelect: () => remove(c) },
                  ]}
                />
              </li>
            )
          )}
        </ul>
      )}
    </div>
  )
}

// ── Notes & expected amounts ─────────────────────────────────────────────

export function NotesTab({ detail, onChanged }: Omit<TabProps, 'confirm'>) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const id = useId()
  const f = detail.family
  const [notes, setNotes] = useState(f.notes ?? '')
  const [parent, setParent] = useState(amountText(f.expectedMonthlyParent))
  const [subsidy, setSubsidy] = useState(amountText(f.expectedMonthlySubsidy))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextParent = parseAmount(parent)
  const nextSubsidy = parseAmount(subsidy)
  const nextNotes = notes.trim() ? notes.trim() : null
  const dirty = nextNotes !== (f.notes ?? null) || nextParent !== f.expectedMonthlyParent || nextSubsidy !== f.expectedMonthlySubsidy

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Number.isNaN(nextParent) || (nextParent !== null && nextParent < 0)) {
      setError('Expected monthly (parent) must be a positive amount.')
      return
    }
    if (Number.isNaN(nextSubsidy) || (nextSubsidy !== null && nextSubsidy < 0)) {
      setError('Expected monthly (subsidy) must be a positive amount.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updateFamily(f.familyId, { notes: nextNotes, expectedMonthlyParent: nextParent, expectedMonthlySubsidy: nextSubsidy })
      showNotification('Notes saved', 'success')
      onChanged()
    } catch (err) {
      setError(errorMessage(err, 'Could not save'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-100 bg-white p-4">
      <FieldRow>
        <Field label="Expected monthly from parent" htmlFor={`${id}-parent`} hint="Used to flag invoices that differ">
          <input id={`${id}-parent`} className={inputClass} inputMode="decimal" value={parent} onChange={(e) => setParent(e.target.value)} placeholder="$0" />
        </Field>
        <Field label="Expected monthly subsidy" htmlFor={`${id}-subsidy`}>
          <input id={`${id}-subsidy`} className={inputClass} inputMode="decimal" value={subsidy} onChange={(e) => setSubsidy(e.target.value)} placeholder="$0" />
        </Field>
      </FieldRow>
      <Field label="Notes" htmlFor={`${id}-notes`}>
        <textarea
          id={`${id}-notes`}
          className={textareaClass}
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment arrangements, reminders…"
        />
      </Field>
      {error && <p className={errorBox}>{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!dirty || busy}
          onClick={() => {
            setNotes(f.notes ?? '')
            setParent(amountText(f.expectedMonthlyParent))
            setSubsidy(amountText(f.expectedMonthlySubsidy))
            setError(null)
          }}
        >
          Discard
        </Button>
        <Button type="submit" loading={busy} disabled={!dirty}>
          Save
        </Button>
      </div>
    </form>
  )
}
