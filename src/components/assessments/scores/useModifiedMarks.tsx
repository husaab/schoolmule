'use client'

// Mark a score as modified: a real mark on a different version of an
// assessment. Shared by the gradebook grid, the score windows and the grading
// view, so the label box, the toasts and the round trip match everywhere. A
// category id marks each item inside it. Nothing here emails a family, so when
// the column is already shared the teacher is told.

import React, { useCallback, useState } from 'react'
import { clearModifiedMark, setModifiedMark } from '@/services/classService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { MODIFIED_SHARED_NOTICE, gradeLevelSuggestions, initialModifiedLabel } from '@/lib/modifiedMark'
import ModifiedLabelPopover, { type PopoverAnchor } from './ModifiedLabelPopover'

/** What a cell needs to offer the menu items and show the mark. */
export interface ModifiedCellControl {
  /** The stored flag: the menu offers Edit and Remove. */
  modified: boolean
  /** The flag shows, because the cell holds a real mark. */
  effective: boolean
  label: string | null
  /** A category stands for each item in it, so it has no one label to edit. */
  category?: boolean
  onEdit: (anchor: HTMLElement) => void
  onRemove: () => void
}

interface UseModifiedMarksArgs {
  classId: string
  /** The class's grade, for the exact-grade label suggestions. */
  grade: string | number | null | undefined
  /** Re-reads the scores so the change shows. */
  onRefresh: () => Promise<void> | void
  /** The grades autosave, when the cells autosave: typed scores go first. */
  autosave?: { flush: () => Promise<void> }
}

interface Editing {
  studentId: string
  assessmentId: string
  anchor: PopoverAnchor
  initialLabel: string
}

export function useModifiedMarks({ classId, grade, onRefresh, autosave }: UseModifiedMarksArgs) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [busy, setBusy] = useState(false)
  const cancel = useCallback(() => setEditing(null), [])

  const save = async (label: string | null) => {
    if (!editing) return
    setBusy(true)
    try {
      await autosave?.flush()
      const { published } = await setModifiedMark(classId, { studentId: editing.studentId, assessmentId: editing.assessmentId, label })
      if (published) showNotification(MODIFIED_SHARED_NOTICE, 'info', 7000)
      else showNotification('Marked as modified.', 'success')
      setEditing(null)
      await onRefresh()
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "That didn't save. Try again.", 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (studentId: string, assessmentId: string) => {
    setBusy(true)
    try {
      await autosave?.flush()
      await clearModifiedMark(classId, { studentId, assessmentId })
      showNotification('Modified removed.', 'success')
      await onRefresh()
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "That didn't save. Try again.", 'error')
    } finally {
      setBusy(false)
    }
  }

  /** The control for one cell. `studentLabels` is this student's labels in the class. */
  const controlFor = (
    studentId: string,
    assessmentId: string,
    cell: { modified: boolean; effective: boolean; label: string | null; category?: boolean },
    studentLabels: string[],
  ): ModifiedCellControl => ({
    ...cell,
    onEdit: (el) => {
      const box = (el.closest('td') ?? el).getBoundingClientRect()
      setEditing({
        studentId,
        assessmentId,
        anchor: { top: box.top, bottom: box.bottom, right: box.right },
        // A category has no one label, so it starts from the student's last one.
        initialLabel: initialModifiedLabel({ modified: cell.modified && !cell.category, current: cell.label, studentLabels }),
      })
    },
    onRemove: () => void remove(studentId, assessmentId),
  })

  const editor: React.ReactNode = editing ? (
    <ModifiedLabelPopover
      key={`${editing.studentId}|${editing.assessmentId}`}
      anchor={editing.anchor}
      initialLabel={editing.initialLabel}
      suggestions={gradeLevelSuggestions(grade)}
      busy={busy}
      onSave={(label) => void save(label)}
      onCancel={cancel}
    />
  ) : null

  return { controlFor, editor }
}
