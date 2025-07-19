// File: src/components/terms/delete/TermDeleteModal.tsx
'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteTerm } from '@/services/termService'
import type { TermPayload } from '@/services/types/term'

interface TermDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleted: (termId: string) => void
  term: TermPayload
}

const TermDeleteModal: React.FC<TermDeleteModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
  term,
}) => {
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteTerm(term.termId)
      if (res.status === 'success') {
        showNotification('Term deleted successfully', 'success')
        onDeleted(term.termId)
        onClose()
      } else {
        showNotification(res.message || 'Failed to delete term', 'error')
      }
    } catch (err) {
      console.error('Error deleting term:', err)
      showNotification('Error deleting term', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl mb-4 text-black">Confirm Delete</h2>
      <p className="text-black mb-6">
        Are you sure you want to delete the term &ldquo;
        <span className="font-semibold">{term.name}</span>&rdquo; for {term.academicYear}?
      </p>
      <p className="text-sm text-red-600 mb-6">
        This action cannot be undone. All classes associated with this term will also be affected.
      </p>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Deleting...' : 'Delete Term'}
        </button>
      </div>
    </Modal>
  )
}

export default TermDeleteModal