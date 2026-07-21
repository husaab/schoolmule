'use client'

// Shared relation-type + parent section for the Add/Edit relation modals.
// The useRelationForm hook owns the form state and payload derivation so the
// two modals don't duplicate the linked-vs-manual mapping logic.

import React, { useState } from 'react'
import PersonCombobox, { ComboOption } from './PersonCombobox'
import type { ParentStudentPayload } from '@/services/types/parentStudent'
import type { ParentPayload } from '@/services/types/parent'

export const RELATION_PRESETS = ['Mother', 'Father', 'Guardian', 'Grandparent'] as const

export type ParentMode = 'linked' | 'manual'

export type SelectedParent = Pick<
  ParentPayload,
  'userId' | 'firstName' | 'lastName' | 'fullName' | 'email'
>

export interface RelationFormState {
  relationPreset: string
  customRelation: string
  mode: ParentMode
  selectedParent: SelectedParent | null
  linkedPhone: string
  manualName: string
  manualEmail: string
  manualPhone: string
}

const initialState = (initial?: ParentStudentPayload): RelationFormState => {
  const preset = RELATION_PRESETS.find(
    (p) => p.toLowerCase() === initial?.relation?.trim().toLowerCase()
  )
  const linked = Boolean(initial?.parentId)

  // A linked account whose users row was deleted still needs a chip so the
  // admin can see and unlink it — fall back to the stored contact fields.
  const selectedParent: SelectedParent | null = linked
    ? initial!.parentUser
      ? {
          userId: initial!.parentId!,
          fullName: `${initial!.parentUser.firstName} ${initial!.parentUser.lastName}`,
          email: initial!.parentUser.email,
          firstName: initial!.parentUser.firstName,
          lastName: initial!.parentUser.lastName,
        }
      : {
          userId: initial!.parentId!,
          fullName: initial!.parentName ?? 'Linked account',
          email: initial!.parentEmail ?? '',
          firstName: '',
          lastName: '',
        }
    : null

  return {
    relationPreset: initial?.relation ? (preset ?? 'Other') : '',
    customRelation: initial?.relation && !preset ? initial.relation : '',
    // New relations default to linking an account; editing follows the data
    mode: initial ? (linked ? 'linked' : 'manual') : 'linked',
    selectedParent,
    linkedPhone: linked ? (initial?.parentNumber ?? '') : '',
    manualName: !linked ? (initial?.parentName ?? '') : '',
    manualEmail: !linked ? (initial?.parentEmail ?? '') : '',
    manualPhone: !linked ? (initial?.parentNumber ?? '') : '',
  }
}

export const useRelationForm = (initial?: ParentStudentPayload) => {
  const [form, setForm] = useState<RelationFormState>(() => initialState(initial))

  const reset = (next?: ParentStudentPayload) => setForm(initialState(next ?? initial))

  const relationValue = () =>
    form.relationPreset === 'Other' ? form.customRelation.trim() : form.relationPreset

  const validate = (): string | null => {
    if (!relationValue()) return 'Select a relation type'
    if (form.mode === 'linked' && !form.selectedParent) return 'Select a parent account to link'
    if (form.mode === 'manual' && !form.manualName.trim()) return "Enter the parent's name"
    return null
  }

  const buildParentFields = () =>
    form.mode === 'linked'
      ? {
          parentId: form.selectedParent!.userId,
          parentName: form.selectedParent!.fullName,
          parentEmail: form.selectedParent!.email || null,
          parentNumber: form.linkedPhone.trim() || null,
        }
      : {
          parentId: null,
          parentName: form.manualName.trim() || null,
          parentEmail: form.manualEmail.trim() || null,
          parentNumber: form.manualPhone.trim() || null,
        }

  const buildParentUser = (): ParentStudentPayload['parentUser'] =>
    form.mode === 'linked' && form.selectedParent
      ? {
          firstName: form.selectedParent.firstName,
          lastName: form.selectedParent.lastName,
          email: form.selectedParent.email,
        }
      : null

  return { form, setForm, reset, relationValue, validate, buildParentFields, buildParentUser }
}

const inputClasses =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent'

interface RelationFormFieldsProps {
  form: RelationFormState
  setForm: React.Dispatch<React.SetStateAction<RelationFormState>>
  parents: ParentPayload[]
  loadingParents: boolean
}

const RelationFormFields: React.FC<RelationFormFieldsProps> = ({
  form,
  setForm,
  parents,
  loadingParents,
}) => {
  const parentOptions: ComboOption[] = parents.map((p) => ({
    id: p.userId,
    primary: p.fullName,
    secondary: p.email,
  }))

  // Only the active mode's fields are submitted (see buildParentFields), so
  // switching tabs never clears anything — saving in Manual mode is what
  // unlinks an account (parentId becomes null on save).
  const switchMode = (mode: ParentMode) => {
    setForm((f) => ({ ...f, mode }))
  }

  return (
    <>
      {/* Relation type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Relation</label>
        <div className="flex flex-wrap gap-2">
          {[...RELATION_PRESETS, 'Other'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setForm((f) => ({ ...f, relationPreset: preset }))}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                form.relationPreset === preset
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        {form.relationPreset === 'Other' && (
          <input
            value={form.customRelation}
            onChange={(e) => setForm((f) => ({ ...f, customRelation: e.target.value }))}
            placeholder="e.g. Aunt, Stepfather…"
            className={`${inputClasses} mt-2`}
          />
        )}
      </div>

      {/* Parent */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent</label>
        <div className="flex p-1 bg-slate-100 rounded-xl mb-3">
          {(
            [
              ['linked', 'Link account'],
              ['manual', 'Manual entry'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                form.mode === mode
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {form.mode === 'linked' ? (
          <div className="space-y-3">
            <PersonCombobox
              options={parentOptions}
              selected={
                form.selectedParent
                  ? {
                      id: form.selectedParent.userId,
                      primary: form.selectedParent.fullName,
                      secondary: form.selectedParent.email,
                    }
                  : null
              }
              onSelect={(opt) => {
                const parent = parents.find((p) => p.userId === opt.id)
                if (!parent) return
                setForm((f) => ({ ...f, selectedParent: parent }))
              }}
              onClear={() => setForm((f) => ({ ...f, selectedParent: null }))}
              placeholder="Search parent accounts…"
              loading={loadingParents}
              searchKeys={(opt) => `${opt.primary} ${opt.secondary ?? ''}`}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                value={form.linkedPhone}
                onChange={(e) => setForm((f) => ({ ...f, linkedPhone: e.target.value }))}
                placeholder="Phone number"
                className={inputClasses}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
              <input
                value={form.manualName}
                onChange={(e) => setForm((f) => ({ ...f, manualName: e.target.value }))}
                placeholder="Parent's full name"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="email"
                value={form.manualEmail}
                onChange={(e) => setForm((f) => ({ ...f, manualEmail: e.target.value }))}
                placeholder="parent@example.com"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                value={form.manualPhone}
                onChange={(e) => setForm((f) => ({ ...f, manualPhone: e.target.value }))}
                placeholder="Phone number"
                className={inputClasses}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default RelationFormFields
