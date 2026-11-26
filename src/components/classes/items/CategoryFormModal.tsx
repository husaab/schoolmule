// src/components/classes/items/CategoryFormModal.tsx
// "New category…" from a form's "Counts toward" picker: a name and what the
// whole category is worth, so a teacher sets up the gradebook without
// leaving the assessment they are writing. The category is saved at once
// (like "New topic…") and picked in the form. Renaming, re-weighting and
// deleting it stay in Grades → Assessments & categories.
'use client'

import { useState } from 'react'
import { RectangleGroupIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { CATEGORY_NAME_MAX, suggestedWeight, validateCategoryForm, weightNote, type CategoryFormErrors } from '@/lib/countsToward'
import { parseWeight } from '@/lib/itemForm'
import { createCategory } from '@/services/classworkService'
import type { CategoryOption } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'

interface CategoryFormModalProps {
  isOpen: boolean
  classId: string
  /** What the class's categories and columns on their own already add up to, of its 100%. */
  pointsUsed: number
  onClose: () => void
  onSaved: (category: CategoryOption) => void
}

function CategoryForm({ classId, pointsUsed, onClose, onSaved }: Omit<CategoryFormModalProps, 'isOpen'>) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [name, setName] = useState('')
  // Starts at what is left of the class's 100%, when that is a real suggestion.
  const [weightPoints, setWeightPoints] = useState(() => suggestedWeight(pointsUsed))
  const [errors, setErrors] = useState<CategoryFormErrors>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const note = weightNote(pointsUsed, weightPoints)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    const found = validateCategoryForm({ name, weightPoints })
    setErrors(found)
    if (found.name || found.weightPoints) return
    setSaving(true)
    setFailure(null)
    try {
      const res = await createCategory(classId, { name: name.trim(), weightPoints: parseWeight(weightPoints) })
      showNotification(`${res.data.name} added`, 'success')
      onSaved(res.data)
    } catch (err) {
      setFailure(err instanceof Error && err.message ? err.message : "The category couldn't be added.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <ModalHeader
        title="New category"
        subtitle="A category groups assessments that share one slice of the final grade, like Tests or Homework."
        icon={RectangleGroupIcon}
      />
      <ModalBody>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="category-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="category-name"
              autoFocus
              value={name}
              maxLength={CATEGORY_NAME_MAX}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g. Tests"
              className={inputClass}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'category-name-error' : undefined}
            />
            {errors.name && (
              <p id="category-name-error" className="mt-1 text-xs text-rose-700">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="category-worth" className="mb-1.5 block text-sm font-medium text-slate-700">
              Worth <span className="font-normal text-slate-500">(% of the final grade, for everything in it together)</span>
            </label>
            <div className="relative w-36">
              <input
                id="category-worth"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                value={weightPoints}
                onChange={(e) => {
                  setWeightPoints(e.target.value)
                  setErrors((prev) => ({ ...prev, weightPoints: undefined }))
                }}
                placeholder="e.g. 40"
                className={`${inputClass} !pr-9`}
                aria-invalid={errors.weightPoints ? true : undefined}
                aria-describedby="category-worth-note"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-500">
                %
              </span>
            </div>
            <p id="category-worth-note" className={`mt-1 text-xs ${errors.weightPoints ? 'text-rose-700' : note.over ? 'text-amber-700' : 'text-slate-500'}`}>
              {errors.weightPoints ?? note.text}
            </p>
          </div>
          {failure && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">
              {failure}
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Add category
        </Button>
      </ModalFooter>
    </form>
  )
}

export default function CategoryFormModal({ isOpen, onClose, ...rest }: CategoryFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Mounted per open, so every open starts empty with the class's current total. */}
      {isOpen && <CategoryForm onClose={onClose} {...rest} />}
    </Modal>
  )
}
