'use client'

import React, { useState } from 'react'
import Modal from '../../shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteSchedule } from '@/services/scheduleService'
import { ScheduleEntry } from '@/services/types/schedule'

interface ScheduleDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  schedule?: ScheduleEntry
  onDeleted: (id: string) => void
}

const ScheduleDeleteModal: React.FC<ScheduleDeleteModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onDeleted,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [loading, setLoading] = useState(false)

  // Only render when open and schedule provided
  if (!isOpen || !schedule) return null

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteSchedule(schedule.schedule_id)
      if (res.status === 'success') {
        showNotification('Schedule deleted successfully', 'success')
        onDeleted(schedule.schedule_id)
        onClose()
      } else {
        showNotification(res.message || 'Failed to delete schedule', 'error')
      }
    } catch (err) {
      console.error('Error deleting schedule:', err)
      showNotification('Error deleting schedule', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl mb-4 text-black">Confirm Delete</h2>
      <p className="text-black">
        Are you sure you want to delete &ldquo;
        <span className="font-semibold">{schedule.subject}</span>&rdquo; (Grade {schedule.grade}) on {schedule.day_of_week} at {schedule.start_time}?
      </p>
      <div className="flex justify-end space-x-4 pt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

export default ScheduleDeleteModal
