'use client'

// Create or edit a custom access role, or look at a built-in one (read-only).
// The permissions come from the server's catalog, grouped as the server
// groups them, so the editor can never offer a key the API would refuse.

import React, { useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import {
  Button,
  Field,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
  textareaClass,
} from '@/components/shared/modalKit'
import { createAccessRole, updateAccessRole } from '@/services/accessRoleService'
import type { AccessRole, BuiltInRole, PermissionCatalog } from '@/services/types/accessRole'
import { useNotificationStore } from '@/store/useNotificationStore'
import { groupPermissions, holdersLabel, orderedSelection, permissionCountLabel, roleNameProblem } from '@/lib/accessRoles'
import { KeyIcon, LockClosedIcon, PencilSquareIcon, SparklesIcon } from '@heroicons/react/24/outline'

/** Starting values for a new role (Duplicate). */
export type RoleSeed = { name: string; description: string; permissions: string[] }

// Mounted fresh for each role it opens (the page renders it only while
// open), so the form starts from its props without syncing in an effect.
interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  catalog: PermissionCatalog
  /** Edit this custom role. */
  role?: AccessRole | null
  /** Show this built-in role, read-only. */
  builtIn?: BuiltInRole | null
  /** Prefill a new role (Duplicate). */
  seed?: RoleSeed | null
  /** The other custom roles' names, so a duplicate name is caught before saving. */
  takenNames: string[]
  onSaved: (role: AccessRole) => void
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, onClose, catalog, role, builtIn, seed, takenNames, onSaved }) => {
  const isEdit = Boolean(role)
  const readOnly = Boolean(builtIn)
  const notify = useNotificationStore((s) => s.showNotification)

  const base = builtIn ?? role ?? seed
  const [name, setName] = useState(base?.name ?? '')
  const [description, setDescription] = useState(base?.description ?? '')
  const [selected, setSelected] = useState<Set<string>>(() => new Set(base?.permissions ?? []))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const sections = useMemo(() => groupPermissions(catalog.groups, catalog.permissions), [catalog])

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const setGroup = (keys: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
      return next
    })

  const startFrom = (preset: { name: string; permissions: string[] }) => {
    setSelected(new Set(preset.permissions))
    if (!name.trim()) setName(preset.name)
  }

  const nameProblem = readOnly ? null : roleNameProblem(name, takenNames)
  const permissions = orderedSelection(catalog.permissions, selected)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (readOnly || nameProblem) return
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: description.trim(), permissions }
      const res = role ? await updateAccessRole(role.roleId, payload) : await createAccessRole(payload)
      notify(role ? `${res.data.name} updated` : `${res.data.name} created`, 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  const subtitle = readOnly
    ? 'Built-in roles are fixed. Create a custom role for anything in between.'
    : isEdit
      ? `${holdersLabel(role?.userCount ?? 0)} ${role?.userCount === 1 ? 'has' : 'have'} this role. Changes apply to them right away.`
      : 'Choose what this role can open and do. Assign it to staff from the Users page.'

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-2xl">
      <form onSubmit={handleSubmit} noValidate>
        <ModalHeader
          title={readOnly ? `${builtIn?.name} (built-in)` : isEdit ? `Edit ${role?.name}` : 'New role'}
          subtitle={subtitle}
          icon={readOnly ? LockClosedIcon : isEdit ? PencilSquareIcon : KeyIcon}
          tone={readOnly ? 'brand' : 'violet'}
        />

        <ModalBody>
          {readOnly ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {builtIn?.description}
              {builtIn?.id === 'admin' && ' Only full admins manage roles, use View as, make someone an Admin and publish patch notes.'}
            </p>
          ) : (
            <FormSection label="Details">
              <Field label="Name" htmlFor="role-name" required>
                <input
                  id="role-name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Office Staff"
                  maxLength={60}
                  autoFocus
                  aria-invalid={touched && Boolean(nameProblem)}
                  aria-describedby={touched && nameProblem ? 'role-name-problem' : undefined}
                />
                {touched && nameProblem && (
                  <p id="role-name-problem" className="mt-1 text-xs text-rose-600">
                    {nameProblem}
                  </p>
                )}
              </Field>
              <Field label="Description" htmlFor="role-description" hint="Shown to admins when they assign this role.">
                <textarea
                  id="role-description"
                  className={textareaClass}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Front office: attendance, students, forms and approvals"
                  maxLength={240}
                />
              </Field>
            </FormSection>
          )}

          {!readOnly && catalog.presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Start from</span>
              {catalog.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => startFrom(preset)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 cursor-pointer"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {preset.name}
                </button>
              ))}
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {sections.map((section) => {
            const keys = section.items.map((i) => i.key)
            const allOn = keys.every((k) => selected.has(k))
            return (
              <FormSection key={section.id} label={section.label}>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setGroup(keys, !allOn)}
                    className="-mt-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer"
                  >
                    {allOn ? 'Clear these' : 'Select all'}
                  </button>
                )}
                <div className="grid gap-2">
                  {section.items.map((p) => {
                    const on = selected.has(p.key)
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                          on ? 'border-cyan-300 bg-cyan-50/60 ring-1 ring-cyan-300' : 'border-slate-200'
                        } ${readOnly ? 'cursor-default' : on ? 'cursor-pointer' : 'cursor-pointer hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={readOnly}
                          onChange={() => toggle(p.key)}
                          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-cyan-600"
                        />
                        <span>
                          <span className="block text-sm font-medium text-slate-900">{p.label}</span>
                          <span className="block text-xs text-slate-500">{p.description}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </FormSection>
            )
          })}

          {!readOnly && (
            <p className="text-xs text-slate-400">
              Everyone keeps their own classes, forms they create, their own check-in and their own conversations,
              whatever their role. Managing roles, View as, making someone an Admin and patch notes always stay with
              full admins.
            </p>
          )}
        </ModalBody>

        <ModalFooter>
          {!readOnly && <span className="mr-auto text-xs text-slate-500">{permissionCountLabel(permissions.length)}</span>}
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button type="submit" variant="violet" loading={saving} disabled={touched && Boolean(nameProblem)}>
              {isEdit ? 'Save changes' : 'Create role'}
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default RoleFormModal
