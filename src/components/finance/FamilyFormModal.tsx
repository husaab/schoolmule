'use client'

// Create or edit a family: its name and flags, expected monthly amounts,
// notes, students, parent contacts and (optionally) its QuickBooks customer.
//
// Create sends one POST. Edit only has endpoints per concern (the family row,
// the customer link, each student, each contact), so saving diffs the form
// against what was loaded and sends just the changes, in order. If one step
// fails after others succeeded, the form reloads from the server so what it
// shows is what was actually saved, and the error says so.

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { PlusIcon, TrashIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import {
  Button,
  Field,
  FieldRow,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
  selectClass,
  textareaClass,
} from '@/components/shared/modalKit'
import PersonCombobox, { type ComboOption } from '@/components/relation/PersonCombobox'
import Spinner from '@/components/Spinner'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  addFamilyContact,
  addFamilyStudent,
  createFamily,
  deleteFamilyContact,
  getFamilyDetail,
  getFamilySuggestions,
  linkFamilyCustomer,
  removeFamilyStudent,
  unlinkFamilyCustomer,
  updateFamily,
  updateFamilyContact,
} from '@/services/financeService'
import type { ContactInput, CreateFamilyInput, PickedCustomer, UpdateFamilyInput } from '@/services/types/finance'
import CustomerPicker from './CustomerPicker'
import {
  DEFAULT_LINK_MODE,
  LinkModeFields,
  RELATION_OPTIONS,
  amountText,
  linkOptions,
  looksLikeEmail,
  parseAmount,
  type LinkModeValue,
} from './familyUi'
import { compareGrades, errorMessage, financeErrorText, gradeShort } from './format'

export interface PoolStudent {
  studentId: string
  name: string
  grade: string
}

export interface FamilyFormPrefill {
  name?: string
  customer?: PickedCustomer | null
  students?: PoolStudent[]
  contacts?: ContactInput[]
}

interface FamilyFormModalProps {
  isOpen: boolean
  /** Edit this family; create a new one when absent. */
  familyId?: string | null
  /** Starting values for a new family (ignored when editing). */
  prefill?: FamilyFormPrefill | null
  onClose: () => void
  /** After a save — including a partial edit save, so the caller can refetch. */
  onSaved: (familyId: string, created: boolean) => void
}

interface ContactRow {
  rowKey: string
  contactId: string | null
  name: string
  email: string
  phone: string
  relation: string
  isPrimary: boolean
  hasAccount: boolean
}

interface FormState {
  name: string
  isSubsidy: boolean
  isTeacher: boolean
  expectedParent: string
  expectedSubsidy: string
  notes: string
  students: PoolStudent[]
  contacts: ContactRow[]
  customer: PickedCustomer | null
}

let rowSeq = 0
const newRowKey = () => `row-${++rowSeq}`

const blankContact = (isPrimary = false): ContactRow => ({
  rowKey: newRowKey(),
  contactId: null,
  name: '',
  email: '',
  phone: '',
  relation: '',
  isPrimary,
  hasAccount: false,
})

const fromPrefill = (p: FamilyFormPrefill | null | undefined): FormState => ({
  name: p?.name ?? '',
  isSubsidy: false,
  isTeacher: false,
  expectedParent: '',
  expectedSubsidy: '',
  notes: '',
  students: p?.students ?? [],
  contacts: (p?.contacts ?? []).map((c, i) => ({
    rowKey: newRowKey(),
    contactId: null,
    name: c.name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    relation: c.relation ?? '',
    isPrimary: c.isPrimary ?? i === 0,
    hasAccount: false,
  })),
  customer: p?.customer ?? null,
})

const clean = (s: string) => (s.trim() ? s.trim() : null)

const contactInput = (r: ContactRow): ContactInput => ({
  name: clean(r.name),
  email: clean(r.email),
  phone: clean(r.phone),
  relation: r.relation || null,
  // Primary only ever moves by setting another contact; never send false.
  ...(r.isPrimary ? { isPrimary: true } : {}),
})

const isBlankRow = (r: ContactRow) => !r.name.trim() && !r.email.trim() && !r.phone.trim()

// ── Body (remounted per opening) ─────────────────────────────────────────

function FamilyFormBody({ familyId, prefill, onClose, onSaved }: Omit<FamilyFormModalProps, 'isOpen'>) {
  const editing = !!familyId
  const formId = useId()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [form, setForm] = useState<FormState>(() => fromPrefill(editing ? null : prefill))
  const [baseline, setBaseline] = useState<FormState | null>(null)
  const [pool, setPool] = useState<PoolStudent[]>([])
  const [poolError, setPoolError] = useState<string | null>(null)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [linkMode, setLinkMode] = useState<LinkModeValue>(DEFAULT_LINK_MODE)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    const suggestions = getFamilySuggestions()
      .then((res) => {
        setPool(res.data.studentsWithoutFamily.map((s) => ({ studentId: s.studentId, name: s.name, grade: s.grade })))
        setPoolError(null)
      })
      .catch((err) => setPoolError(errorMessage(err, 'Could not load students without a family')))
    if (!familyId) {
      await suggestions
      return
    }
    setLoading(true)
    try {
      const res = await getFamilyDetail(familyId)
      const d = res.data
      const link = d.customerLinks.find((l) => l.current) ?? null
      const state: FormState = {
        name: d.family.name,
        isSubsidy: d.family.isSubsidy,
        isTeacher: d.family.isTeacher,
        expectedParent: amountText(d.family.expectedMonthlyParent),
        expectedSubsidy: amountText(d.family.expectedMonthlySubsidy),
        notes: d.family.notes ?? '',
        students: d.students.map((s) => ({ studentId: s.studentId, name: s.name, grade: s.grade })),
        contacts: d.contacts.map((c) => ({
          rowKey: newRowKey(),
          contactId: c.contactId,
          name: c.name ?? '',
          email: c.email ?? '',
          phone: c.phone ?? '',
          relation: c.relation ?? '',
          isPrimary: c.isPrimary,
          hasAccount: c.hasAccount,
        })),
        customer: d.customer
          ? {
              qboId: d.customer.qboId,
              displayName: d.customer.displayName ?? link?.customerName ?? `Customer ${d.customer.qboId}`,
              isSubCustomer: link?.isSubCustomer ?? false,
              active: link?.customerActive ?? true,
            }
          : null,
      }
      setBaseline(state)
      setForm(state)
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load this family'))
    } finally {
      setLoading(false)
    }
    await suggestions
  }, [familyId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const setContact = (rowKey: string, patch: Partial<ContactRow>) =>
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c) =>
        c.rowKey === rowKey ? { ...c, ...patch } : patch.isPrimary ? { ...c, isPrimary: false } : c
      ),
    }))

  // Students the picker can offer: the ones without a family, plus this
  // family's own (so a removed one can be put back), minus those chosen.
  const studentOptions: ComboOption[] = useMemo(() => {
    const chosen = new Set(form.students.map((s) => s.studentId))
    const all = new Map<string, PoolStudent>()
    for (const s of [...pool, ...(baseline?.students ?? []), ...(prefill?.students ?? [])]) all.set(s.studentId, s)
    return [...all.values()]
      .filter((s) => !chosen.has(s.studentId))
      .sort((a, b) => compareGrades(a.grade, b.grade) || a.name.localeCompare(b.name))
      .map((s) => ({ id: s.studentId, primary: s.name, secondary: gradeShort(s.grade) }))
  }, [pool, baseline, prefill, form.students])

  const addStudent = (opt: ComboOption) => {
    const found =
      pool.find((s) => s.studentId === opt.id) ??
      baseline?.students.find((s) => s.studentId === opt.id) ??
      prefill?.students?.find((s) => s.studentId === opt.id)
    if (found) set('students', [...form.students, found])
  }

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!form.name.trim()) return 'Give the family a name.'
    const parent = parseAmount(form.expectedParent)
    const subsidy = parseAmount(form.expectedSubsidy)
    if (Number.isNaN(parent) || (parent !== null && parent < 0)) return 'Expected monthly (parent) must be a positive amount.'
    if (Number.isNaN(subsidy) || (subsidy !== null && subsidy < 0)) return 'Expected monthly (subsidy) must be a positive amount.'
    for (const c of form.contacts) {
      if (isBlankRow(c)) continue
      if (!c.name.trim() && !c.email.trim()) return 'Each contact needs a name or an email.'
      if (c.email.trim() && !looksLikeEmail(c.email.trim())) return `“${c.email.trim()}” doesn’t look like an email address.`
    }
    const emails = form.contacts.map((c) => c.email.trim().toLowerCase()).filter(Boolean)
    if (new Set(emails).size !== emails.length) return 'Two contacts share the same email.'
    return null
  }

  // ── Save ────────────────────────────────────────────────────────────────
  const saveCreate = async () => {
    const contacts = form.contacts.filter((c) => !isBlankRow(c)).map(contactInput)
    const body: CreateFamilyInput = {
      name: form.name.trim(),
      isSubsidy: form.isSubsidy,
      isTeacher: form.isTeacher,
      expectedMonthlyParent: parseAmount(form.expectedParent),
      expectedMonthlySubsidy: parseAmount(form.expectedSubsidy),
      notes: clean(form.notes),
      studentIds: form.students.map((s) => s.studentId),
      contacts,
      ...(form.customer ? { qboCustomerId: form.customer.qboId } : {}),
    }
    const res = await createFamily(body)
    showNotification(`${res.data.name} added`, 'success')
    onSaved(res.data.familyId, true)
    onClose()
  }

  const saveEdit = async (id: string, base: FormState) => {
    const steps: (() => Promise<unknown>)[] = []

    const core: UpdateFamilyInput = {}
    if (form.name.trim() !== base.name) core.name = form.name.trim()
    if (form.isSubsidy !== base.isSubsidy) core.isSubsidy = form.isSubsidy
    if (form.isTeacher !== base.isTeacher) core.isTeacher = form.isTeacher
    const parent = parseAmount(form.expectedParent)
    const subsidy = parseAmount(form.expectedSubsidy)
    if (parent !== parseAmount(base.expectedParent)) core.expectedMonthlyParent = parent
    if (subsidy !== parseAmount(base.expectedSubsidy)) core.expectedMonthlySubsidy = subsidy
    if (clean(form.notes) !== clean(base.notes)) core.notes = clean(form.notes)
    if (Object.keys(core).length > 0) steps.push(() => updateFamily(id, core))

    if ((form.customer?.qboId ?? null) !== (base.customer?.qboId ?? null)) {
      const next = form.customer
      // Replace only means something when there was a customer to replace.
      // A first link takes no options: the server starts it at the year's start.
      const opts = base.customer ? linkOptions(linkMode) : {}
      steps.push(() => (next ? linkFamilyCustomer(id, next.qboId, opts) : unlinkFamilyCustomer(id)))
    }

    const nowIds = new Set(form.students.map((s) => s.studentId))
    const baseIds = new Set(base.students.map((s) => s.studentId))
    for (const s of base.students) if (!nowIds.has(s.studentId)) steps.push(() => removeFamilyStudent(id, s.studentId))
    for (const s of form.students) if (!baseIds.has(s.studentId)) steps.push(() => addFamilyStudent(id, s.studentId))

    const rows = form.contacts.filter((c) => !(isBlankRow(c) && !c.contactId))
    const keptIds = new Set(rows.map((c) => c.contactId).filter(Boolean))
    for (const c of base.contacts) {
      if (c.contactId && !keptIds.has(c.contactId)) {
        const cid = c.contactId
        steps.push(() => deleteFamilyContact(id, cid))
      }
    }
    // Primary last, so whichever contact ends up primary is written after
    // any other that might claim it.
    const ordered = [...rows].sort((a, b) => Number(a.isPrimary) - Number(b.isPrimary))
    for (const r of ordered) {
      if (!r.contactId) {
        steps.push(() => addFamilyContact(id, contactInput(r)))
        continue
      }
      const before = base.contacts.find((c) => c.contactId === r.contactId)
      if (!before) continue
      const patch: ContactInput = {}
      if (clean(r.name) !== clean(before.name)) patch.name = clean(r.name)
      if (clean(r.email) !== clean(before.email)) patch.email = clean(r.email)
      if (clean(r.phone) !== clean(before.phone)) patch.phone = clean(r.phone)
      if ((r.relation || null) !== (before.relation || null)) patch.relation = r.relation || null
      if (r.isPrimary && !before.isPrimary) patch.isPrimary = true
      if (Object.keys(patch).length > 0) {
        const cid = r.contactId
        steps.push(() => updateFamilyContact(id, cid, patch))
      }
    }

    if (steps.length === 0) {
      onClose()
      return
    }

    let done = 0
    try {
      for (const step of steps) {
        await step()
        done++
      }
    } catch (err) {
      const message = financeErrorText(err, 'Could not save the family')
      if (done === 0) throw err
      onSaved(id, false)
      setError(`Some changes were saved, but the rest failed: ${message} The form now shows what was saved.`)
      await load()
      return
    }
    showNotification('Family saved', 'success')
    onSaved(id, false)
    onClose()
  }

  const save = async () => {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (familyId && baseline) await saveEdit(familyId, baseline)
      else await saveCreate()
    } catch (err) {
      setError(financeErrorText(err, 'Could not save the family'))
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const header = (
    <ModalHeader
      title={editing ? 'Edit family' : 'Add family'}
      subtitle={editing ? baseline?.name ?? 'Loading…' : 'Group siblings under one family and link it to QuickBooks'}
      icon={UserGroupIcon}
    />
  )

  if (editing && (loading || loadError) && !baseline) {
    return (
      <>
        {header}
        <ModalBody>
          {loadError ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-rose-600">{loadError}</p>
              <Button variant="secondary" onClick={() => load()}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}
        </ModalBody>
      </>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      {header}
      <ModalBody>
        {error && (
          <p ref={errorRef} role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <FormSection label="Family">
          <Field label="Family name" htmlFor={`${formId}-name`} required>
            <input
              id={`${formId}-name`}
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Rahman family"
              maxLength={200}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['isSubsidy', 'Subsidy family', 'Part of the tuition is paid by the grant'],
                ['isTeacher', 'Teacher family', 'A staff member’s children'],
              ] as const
            ).map(([key, label, hint]) => (
              <label
                key={key}
                className={`flex flex-1 min-w-[200px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  form[key] ? 'border-cyan-200 bg-cyan-50/60' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">{label}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldRow>
            <Field label="Expected monthly from parent" htmlFor={`${formId}-parent`} hint="Leave blank if it varies">
              <input
                id={`${formId}-parent`}
                className={inputClass}
                inputMode="decimal"
                value={form.expectedParent}
                onChange={(e) => set('expectedParent', e.target.value)}
                placeholder="$0"
              />
            </Field>
            <Field label="Expected monthly subsidy" htmlFor={`${formId}-subsidy`}>
              <input
                id={`${formId}-subsidy`}
                className={inputClass}
                inputMode="decimal"
                value={form.expectedSubsidy}
                onChange={(e) => set('expectedSubsidy', e.target.value)}
                placeholder="$0"
              />
            </Field>
          </FieldRow>
          <Field label="Notes" htmlFor={`${formId}-notes`}>
            <textarea
              id={`${formId}-notes`}
              className={textareaClass}
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Payment arrangements, reminders…"
            />
          </Field>
        </FormSection>

        <FormSection label={`Students (${form.students.length})`}>
          {form.students.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {form.students.map((s) => (
                <li
                  key={s.studentId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-sm text-slate-800"
                >
                  {s.name}
                  <span className="text-xs text-slate-400">{gradeShort(s.grade)}</span>
                  <button
                    type="button"
                    onClick={() => set('students', form.students.filter((x) => x.studentId !== s.studentId))}
                    aria-label={`Remove ${s.name}`}
                    className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <PersonCombobox
            options={studentOptions}
            selected={null}
            onSelect={addStudent}
            placeholder="Add a student without a family…"
            searchKeys={(o) => `${o.primary} ${o.secondary ?? ''}`}
          />
          {poolError && <p className="text-xs text-amber-700">{poolError}</p>}
        </FormSection>

        <FormSection label="Parent contacts">
          {form.contacts.length === 0 && <p className="text-sm text-slate-500">No contacts yet.</p>}
          <div className="space-y-2">
            {form.contacts.map((c, i) => (
              <div key={c.rowKey} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    aria-label={`Contact ${i + 1} name`}
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => setContact(c.rowKey, { name: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    aria-label={`Contact ${i + 1} email`}
                    placeholder="Email"
                    type="email"
                    value={c.email}
                    onChange={(e) => setContact(c.rowKey, { email: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    aria-label={`Contact ${i + 1} phone`}
                    placeholder="Phone"
                    type="tel"
                    value={c.phone}
                    onChange={(e) => setContact(c.rowKey, { phone: e.target.value })}
                  />
                  <select
                    className={selectClass}
                    aria-label={`Contact ${i + 1} relation`}
                    value={c.relation}
                    onChange={(e) => setContact(c.rowKey, { relation: e.target.value })}
                  >
                    <option value="">Relation…</option>
                    {RELATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="radio"
                      name={`${formId}-primary`}
                      checked={c.isPrimary}
                      onChange={() => setContact(c.rowKey, { isPrimary: true })}
                      className="h-3.5 w-3.5 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Primary contact
                    {c.hasAccount && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Has account</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => set('contacts', form.contacts.filter((x) => x.rowKey !== c.rowKey))}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set('contacts', [...form.contacts, blankContact(form.contacts.length === 0)])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-700 cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            Add contact
          </button>
        </FormSection>

        <FormSection label="QuickBooks customer">
          <CustomerPicker
            value={form.customer}
            onChange={(c) => {
              set('customer', c)
              // Default a switch to the new customer's first invoice this year.
              if (c && baseline?.customer) setLinkMode((m) => ({ ...m, effectiveFrom: c.earliestInvoiceDate ?? '' }))
            }}
            familyId={familyId ?? null}
          />
          {editing && baseline?.customer && form.customer && form.customer.qboId !== baseline.customer.qboId ? (
            <LinkModeFields
              value={linkMode}
              onChange={setLinkMode}
              currentName={baseline.customer.displayName}
              earliestInvoiceDate={form.customer.earliestInvoiceDate ?? null}
            />
          ) : (
            <p className="text-xs text-slate-400">
              {editing
                ? baseline?.customer && !form.customer
                  ? 'Saving closes the current link as of today; past invoices stay with it in History.'
                  : 'Pick another customer to switch from a date or replace the current link.'
                : 'Optional — you can link the family later.'}
            </p>
          )}
        </FormSection>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {editing ? 'Save changes' : 'Add family'}
        </Button>
      </ModalFooter>
    </form>
  )
}

// ── Shell ────────────────────────────────────────────────────────────────

const FamilyFormModal: React.FC<FamilyFormModalProps> = ({ isOpen, familyId, prefill, onClose, onSaved }) => {
  // A fresh form every time the modal opens.
  const [session, setSession] = useState(0)
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) setSession((n) => n + 1)
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <FamilyFormBody key={`${session}-${familyId ?? 'new'}`} familyId={familyId} prefill={prefill} onClose={onClose} onSaved={onSaved} />
    </Modal>
  )
}

export default FamilyFormModal
