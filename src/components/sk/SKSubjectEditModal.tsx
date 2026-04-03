'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  updateSKSubject,
  createSKStandard,
  updateSKStandard,
  deleteSKStandard,
} from '@/services/skService'
import type { SKSubject, SKStandard } from '@/services/types/sk'
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'

interface SKSubjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  subject: SKSubject
  onUpdate: () => void
}

interface EditingStandard {
  standardId: string | null // null = new standard
  name: string
  description: string
  sortOrder: number
}

export default function SKSubjectEditModal({
  isOpen,
  onClose,
  subject,
  onUpdate,
}: SKSubjectEditModalProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Subject name editing
  const [subjectName, setSubjectName] = useState(subject.name)
  const [isEditingSubjectName, setIsEditingSubjectName] = useState(false)
  const [savingSubjectName, setSavingSubjectName] = useState(false)

  // Standard being added/edited inline
  const [editingStandard, setEditingStandard] = useState<EditingStandard | null>(null)
  const [savingStandard, setSavingStandard] = useState(false)
  const [deletingStandardId, setDeletingStandardId] = useState<string | null>(null)

  // Reset state when subject changes
  useEffect(() => {
    setSubjectName(subject.name)
    setIsEditingSubjectName(false)
    setEditingStandard(null)
  }, [subject])

  const handleSaveSubjectName = async () => {
    if (!subjectName.trim()) return
    setSavingSubjectName(true)
    try {
      const res = await updateSKSubject(subject.subjectId, {
        name: subjectName.trim(),
        sortOrder: subject.sortOrder,
      })
      if (res.status === 'success') {
        showNotification('Subject name updated', 'success')
        setIsEditingSubjectName(false)
        onUpdate()
      }
    } catch {
      showNotification('Failed to update subject name', 'error')
    } finally {
      setSavingSubjectName(false)
    }
  }

  const handleStartAddStandard = () => {
    setEditingStandard({
      standardId: null,
      name: '',
      description: '',
      sortOrder: subject.standards.length + 1,
    })
  }

  const handleStartEditStandard = (standard: SKStandard) => {
    setEditingStandard({
      standardId: standard.standardId,
      name: standard.name,
      description: standard.description || '',
      sortOrder: standard.sortOrder,
    })
  }

  const handleSaveStandard = async () => {
    if (!editingStandard || !editingStandard.name.trim()) return
    setSavingStandard(true)
    try {
      if (editingStandard.standardId) {
        // Update existing
        const res = await updateSKStandard(editingStandard.standardId, {
          name: editingStandard.name.trim(),
          description: editingStandard.description.trim() || null,
          sortOrder: editingStandard.sortOrder,
        })
        if (res.status === 'success') {
          showNotification('Standard updated', 'success')
        }
      } else {
        // Create new
        const res = await createSKStandard({
          subjectId: subject.subjectId,
          name: editingStandard.name.trim(),
          description: editingStandard.description.trim() || null,
          sortOrder: editingStandard.sortOrder,
        })
        if (res.status === 'success') {
          showNotification('Standard added', 'success')
        }
      }
      setEditingStandard(null)
      onUpdate()
    } catch {
      showNotification('Failed to save standard', 'error')
    } finally {
      setSavingStandard(false)
    }
  }

  const handleDeleteStandard = async (standardId: string) => {
    setDeletingStandardId(standardId)
    try {
      const res = await deleteSKStandard(standardId)
      if (res.status === 'success') {
        showNotification('Standard deleted', 'success')
        onUpdate()
      }
    } catch {
      showNotification('Failed to delete standard', 'error')
    } finally {
      setDeletingStandardId(null)
    }
  }

  const documentTypeLabel =
    subject.documentType === 'progress_report' ? 'Progress Report' : 'Report Card'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Subject — ${documentTypeLabel}`} size="lg">
      <div className="p-6 space-y-6">
        {/* Subject Name */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Subject Name
          </label>
          {isEditingSubjectName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveSubjectName()
                  if (e.key === 'Escape') {
                    setSubjectName(subject.name)
                    setIsEditingSubjectName(false)
                  }
                }}
              />
              <button
                onClick={handleSaveSubjectName}
                disabled={savingSubjectName || !subjectName.trim()}
                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {savingSubjectName ? <Spinner size="sm" /> : <CheckIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setSubjectName(subject.name)
                  setIsEditingSubjectName(false)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{subject.name}</p>
              </div>
              <button
                onClick={() => setIsEditingSubjectName(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Standards List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Standards ({subject.standards.length})
            </label>
            <button
              onClick={handleStartAddStandard}
              disabled={!!editingStandard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Standard
            </button>
          </div>

          <div className="space-y-2">
            {subject.standards.map((standard) =>
              editingStandard?.standardId === standard.standardId ? (
                /* Inline edit form for existing standard */
                <div
                  key={standard.standardId}
                  className="p-3 border-2 border-purple-200 bg-purple-50 rounded-xl space-y-2"
                >
                  <input
                    type="text"
                    value={editingStandard.name}
                    onChange={(e) =>
                      setEditingStandard({ ...editingStandard, name: e.target.value })
                    }
                    placeholder="Standard name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editingStandard.description}
                    onChange={(e) =>
                      setEditingStandard({ ...editingStandard, description: e.target.value })
                    }
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingStandard(null)}
                      className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveStandard}
                      disabled={savingStandard || !editingStandard.name.trim()}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {savingStandard ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-only standard row */
                <div
                  key={standard.standardId}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{standard.name}</p>
                    {standard.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {standard.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEditStandard(standard)}
                      disabled={!!editingStandard}
                      className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      title="Edit standard"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStandard(standard.standardId)}
                      disabled={deletingStandardId === standard.standardId}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      title="Delete standard"
                    >
                      {deletingStandardId === standard.standardId ? (
                        <Spinner size="sm" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* New standard inline form (appears at bottom when adding) */}
            {editingStandard?.standardId === null && (
              <div className="p-3 border-2 border-emerald-200 bg-emerald-50 rounded-xl space-y-2">
                <input
                  type="text"
                  value={editingStandard.name}
                  onChange={(e) =>
                    setEditingStandard({ ...editingStandard, name: e.target.value })
                  }
                  placeholder="New standard name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingStandard.name.trim()) handleSaveStandard()
                    if (e.key === 'Escape') setEditingStandard(null)
                  }}
                />
                <input
                  type="text"
                  value={editingStandard.description}
                  onChange={(e) =>
                    setEditingStandard({ ...editingStandard, description: e.target.value })
                  }
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingStandard(null)}
                    className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveStandard}
                    disabled={savingStandard || !editingStandard.name.trim()}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {savingStandard ? 'Saving...' : 'Add Standard'}
                  </button>
                </div>
              </div>
            )}

            {subject.standards.length === 0 && !editingStandard && (
              <div className="text-center py-6 text-slate-400 text-sm">
                No standards yet. Click &ldquo;Add Standard&rdquo; to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
