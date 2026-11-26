// src/components/settings/StudentCustomFieldsCard.tsx
// Admin Panel → School Settings: the school's own student fields. Anyone who
// edits students can add a field from the student form; here an admin names
// them, puts them in order, deletes one and gets a deleted one back.
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowUturnLeftIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  PlusIcon,
  SquaresPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/shared/modalKit'
import { FieldTypeTag } from '@/components/student/customFields/FieldTypeTag'
import { useStudentCustomFields } from '@/hooks/useStudentCustomFields'
import { getDeletedCustomFields, reorderCustomFields, restoreCustomField } from '@/services/studentCustomFieldService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { CustomFieldDefinition, DeletedCustomField } from '@/services/types/studentCustomField'
import CustomFieldModal from './CustomFieldModal'
import DeleteCustomFieldModal from './DeleteCustomFieldModal'

const iconButton =
  'cursor-pointer rounded-lg p-2 text-slate-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-30'

const SHOWN_OPTIONS = 4

interface RowProps {
  field: CustomFieldDefinition
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onEdit: (field: CustomFieldDefinition) => void
  onDelete: (field: CustomFieldDefinition) => void
}

const FieldRow = ({ field, index, count, onMove, onEdit, onDelete }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.fieldId })
  const options = field.options ?? []

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${
        isDragging ? 'relative z-10 border-cyan-300 shadow-lg' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${field.label}`}
        className="flex-shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-slate-300 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 active:cursor-grabbing"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium text-slate-900">{field.label}</span>
          <FieldTypeTag type={field.type} />
        </div>
        {options.length > 0 && (
          <p className="mt-1 truncate text-xs text-slate-500">
            {options.slice(0, SHOWN_OPTIONS).join(', ')}
            {options.length > SHOWN_OPTIONS && ` and ${options.length - SHOWN_OPTIONS} more`}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center">
        {/* The same reordering without a pointer or a drag. */}
        <button
          type="button"
          aria-label={`Move ${field.label} up`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          className={`${iconButton} hidden hover:bg-slate-100 hover:text-slate-700 sm:block`}
        >
          <ChevronUpIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Move ${field.label} down`}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
          className={`${iconButton} hidden hover:bg-slate-100 hover:text-slate-700 sm:block`}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Edit ${field.label}`}
          onClick={() => onEdit(field)}
          className={`${iconButton} hover:bg-cyan-50 hover:text-cyan-600`}
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${field.label}`}
          onClick={() => onDelete(field)}
          className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

const formatDeleted = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export default function StudentCustomFieldsCard() {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { fields, loading, error, reload, setFields, upsertField, removeField } = useStudentCustomFields()
  const [deleted, setDeleted] = useState<DeletedCustomField[]>([])
  const [showDeleted, setShowDeleted] = useState(false)
  const [editing, setEditing] = useState<CustomFieldDefinition | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CustomFieldDefinition | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loadDeleted = useCallback(async () => {
    try {
      setDeleted((await getDeletedCustomFields()).data)
    } catch {
      // The list of live fields is the card's job; a failed bin is retried on the next change.
    }
  }, [])

  useEffect(() => {
    void loadDeleted()
  }, [loadDeleted])

  // "Manage fields" on the student form links here by #id, but this card
  // mounts after the page's own loading screen, when the browser has already
  // given up on the hash.
  const section = useRef<HTMLElement>(null)
  useEffect(() => {
    if (window.location.hash === '#student-custom-fields') section.current?.scrollIntoView({ block: 'start' })
  }, [])

  // Only the latest move's answer is shown: an earlier one arriving late
  // would put the rows back where they were a moment ago.
  const latestMove = useRef(0)

  const move = async (from: number, to: number) => {
    if (!fields || from === to || from < 0 || to < 0 || from >= fields.length || to >= fields.length) return
    const next = arrayMove(fields, from, to)
    const thisMove = ++latestMove.current
    setFields(() => next) // at once; put back if the server refuses
    try {
      const res = await reorderCustomFields(next.map((f) => f.fieldId))
      if (thisMove === latestMove.current) setFields(() => res.data)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "The new order couldn't be saved", 'error')
      reload()
    }
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!fields || !over || active.id === over.id) return
    void move(
      fields.findIndex((f) => f.fieldId === active.id),
      fields.findIndex((f) => f.fieldId === over.id),
    )
  }

  const restore = async (field: DeletedCustomField) => {
    setRestoring(field.fieldId)
    try {
      const res = await restoreCustomField(field.fieldId)
      upsertField(res.data)
      setDeleted((list) => list.filter((f) => f.fieldId !== field.fieldId))
      showNotification(res.message || `"${field.label}" is back`, 'success')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "The field couldn't be restored", 'error')
    } finally {
      setRestoring(null)
    }
  }

  const editingField = editing && editing !== 'new' ? editing : null

  return (
    <section
      ref={section}
      id="student-custom-fields"
      className="mb-6 scroll-mt-40 rounded-lg border border-gray-200 bg-white shadow-sm"
      aria-labelledby="student-custom-fields-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
        <div className="min-w-0">
          <h2 id="student-custom-fields-heading" className="flex items-center gap-2 text-xl font-semibold">
            <SquaresPlusIcon className="h-6 w-6" />
            Custom student fields
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Your school&apos;s own fields on every student, like a bus route or photo consent. Staff only: parents and students never see them.
          </p>
        </div>
        {fields && fields.length > 0 && (
          <Button type="button" onClick={() => setEditing('new')}>
            <PlusIcon className="h-4 w-4" />
            Add field
          </Button>
        )}
      </div>

      <div className="p-6">
        {fields === null && loading && (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[52px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {fields === null && error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>The custom fields didn&apos;t load.</span>
            <Button type="button" variant="secondary" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {fields !== null && fields.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
              <SquaresPlusIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No custom fields yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Add a field for anything you record about students that SchoolMule doesn&apos;t already have. Staff can also add one
              while editing a student, and the forms import can save a form question into one.
            </p>
            <Button type="button" className="mt-4" onClick={() => setEditing('new')}>
              <PlusIcon className="h-4 w-4" />
              Add the first field
            </Button>
          </div>
        )}

        {fields !== null && fields.length > 0 && (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={fields.map((f) => f.fieldId)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {fields.map((field, index) => (
                    <FieldRow
                      key={field.fieldId}
                      field={field}
                      index={index}
                      count={fields.length}
                      onMove={(from, to) => void move(from, to)}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            <p className="mt-3 text-xs text-slate-400">Drag to set the order they appear in on the student form and profile.</p>
          </>
        )}

        {deleted.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              aria-expanded={showDeleted}
              onClick={() => setShowDeleted((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showDeleted ? '' : '-rotate-90'}`} />
              Deleted fields ({deleted.length})
            </button>

            {showDeleted && (
              <>
                <p className="mt-2 text-xs text-slate-500">
                  Hidden everywhere, with every student&apos;s answer kept. Restoring a field brings the answers back.
                </p>
                <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {deleted.map((field) => (
                    <li key={field.fieldId} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-sm font-medium text-slate-700">{field.label}</span>
                          <FieldTypeTag type={field.type} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Deleted {formatDeleted(field.deletedAt)}
                          {field.deletedByName ? ` by ${field.deletedByName}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        loading={restoring === field.fieldId}
                        disabled={restoring !== null}
                        onClick={() => void restore(field)}
                        className="flex-shrink-0"
                      >
                        {restoring !== field.fieldId && <ArrowUturnLeftIcon className="h-4 w-4" />}
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <CustomFieldModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        field={editingField}
        otherLabels={(fields ?? []).filter((f) => f.fieldId !== editingField?.fieldId).map((f) => f.label)}
        onSaved={upsertField}
      />

      <DeleteCustomFieldModal
        field={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={(field) => {
          removeField(field.fieldId)
          void loadDeleted()
        }}
      />
    </section>
  )
}
