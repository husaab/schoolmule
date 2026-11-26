'use client'

import React, { useRef } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { inputClass } from '@/components/shared/modalKit'
import { CUSTOM_FIELD_LIMITS, newNoteKey, type NoteDraft } from '@/lib/studentCustomFields'

interface StudentNotesEditorProps {
  notes: NoteDraft[]
  onChange: (notes: NoteDraft[]) => void
  idPrefix: string
}

/**
 * One-off facts about this student only: a label and what it says. For the
 * thing worth writing down about one child that doesn't deserve a field on
 * every student.
 */
const StudentNotesEditor: React.FC<StudentNotesEditorProps> = ({ notes, onChange, idPrefix }) => {
  const list = useRef<HTMLDivElement>(null)
  const full = notes.length >= CUSTOM_FIELD_LIMITS.notes

  const update = (key: string, change: Partial<NoteDraft>) =>
    onChange(notes.map((note) => (note.key === key ? { ...note, ...change } : note)))

  const add = () => {
    onChange([...notes, { key: newNoteKey(), label: '', value: '' }])
    // The new row exists after this render: put the cursor in its label.
    requestAnimationFrame(() => {
      const inputs = list.current?.querySelectorAll<HTMLInputElement>('input[data-note-label]')
      inputs?.[inputs.length - 1]?.focus()
    })
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-slate-700">Notes for this student</p>
        <p className="mt-0.5 text-xs text-slate-400">Only on this student. They don&apos;t add a field for everyone.</p>
      </div>

      {notes.length > 0 && (
        <div ref={list} className="space-y-2">
          {notes.map((note, index) => (
            <div key={note.key} className="flex items-start gap-2">
              <input
                data-note-label
                aria-label={`Note ${index + 1} label`}
                id={`${idPrefix}-note-${index}-label`}
                value={note.label}
                maxLength={CUSTOM_FIELD_LIMITS.noteLabel}
                onChange={(e) => update(note.key, { label: e.target.value })}
                placeholder="Label"
                className={`${inputClass} w-2/5 sm:w-1/3`}
              />
              <input
                aria-label={`Note ${index + 1}`}
                value={note.value}
                maxLength={CUSTOM_FIELD_LIMITS.noteValue}
                onChange={(e) => update(note.key, { value: e.target.value })}
                placeholder="What to remember"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <button
                type="button"
                aria-label={note.label.trim() ? `Remove the note "${note.label.trim()}"` : `Remove note ${index + 1}`}
                onClick={() => onChange(notes.filter((n) => n.key !== note.key))}
                className="mt-1 flex-shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {full ? (
        <p className="text-xs text-slate-400">That&apos;s the most notes a student can have ({CUSTOM_FIELD_LIMITS.notes}).</p>
      ) : (
        <button
          type="button"
          onClick={add}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg text-sm font-medium text-cyan-600 hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <PlusIcon className="h-4 w-4" />
          Add a note
        </button>
      )}
    </div>
  )
}

export default StudentNotesEditor
