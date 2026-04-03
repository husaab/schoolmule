'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createSKSubject } from '@/services/skService'
import Spinner from '@/components/Spinner'

interface SKSubjectAddModalProps {
  isOpen: boolean
  onClose: () => void
  documentType: 'progress_report' | 'report_card'
  school: string
  currentCount: number
  onAdded: () => void
}

export default function SKSubjectAddModal({
  isOpen,
  onClose,
  documentType,
  school,
  currentCount,
  onAdded,
}: SKSubjectAddModalProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const documentTypeLabel =
    documentType === 'progress_report' ? 'Progress Report' : 'Report Card'

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await createSKSubject({
        documentType,
        name: name.trim(),
        sortOrder: currentCount + 1,
        school,
      })
      if (res.status === 'success') {
        showNotification('Subject created', 'success')
        setName('')
        onAdded()
        onClose()
      }
    } catch {
      showNotification('Failed to create subject', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add ${documentTypeLabel} Subject`} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Subject Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Mathematics"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) handleSave()
            }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl text-sm font-medium hover:bg-slate-200 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {saving ? <Spinner size="sm" /> : null}
            {saving ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
