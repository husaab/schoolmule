'use client'

import React, { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  createPlannerRoom,
  updatePlannerRoom,
  deletePlannerRoom,
} from '@/services/schedulePlannerService'
import type { PlannerRoom } from '@/services/types/schedulePlanner'

interface RoomsTabProps {
  rooms: PlannerRoom[]
  onChanged: () => void
}

const RoomsTab: React.FC<RoomsTabProps> = ({ rooms, onChanged }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [name, setName] = useState('')
  const [capacityNote, setCapacityNote] = useState('')
  const [saving, setSaving] = useState(false)

  const startAdd = () => {
    setName('')
    setCapacityNote('')
    setEditingId('new')
  }

  const startEdit = (room: PlannerRoom) => {
    setName(room.name)
    setCapacityNote(room.capacityNote || '')
    setEditingId(room.roomId)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification('Room name is required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = { name: name.trim(), capacityNote: capacityNote.trim() || null }
      if (editingId === 'new') {
        await createPlannerRoom(payload)
        showNotification('Room added', 'success')
      } else if (editingId) {
        await updatePlannerRoom(editingId, payload)
        showNotification('Room updated', 'success')
      }
      setEditingId(null)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving room', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (room: PlannerRoom) => {
    if (!confirm(`Remove ${room.name}?`)) return
    try {
      await deletePlannerRoom(room.roomId)
      showNotification('Room removed', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error removing room', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Shared spaces (gym, lab, prayer hall) that only one class can use at a time.
        </p>
        <button
          onClick={startAdd}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> Add room
        </button>
      </div>

      {editingId && (
        <div className="border border-cyan-200 bg-cyan-50/40 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">{editingId === 'new' ? 'New room' : 'Edit room'}</h3>
            <button onClick={() => setEditingId(null)} className="cursor-pointer">
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="Gym"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
              <input
                type="text"
                value={capacityNote}
                onChange={(e) => setCapacityNote(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="Fits two classes"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save room'}
          </button>
        </div>
      )}

      {rooms.length === 0 && !editingId ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No shared rooms yet. If every class stays in its homeroom, you can skip this.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Note</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.roomId} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium">{room.name}</td>
                  <td className="py-2 pr-4 text-gray-500">{room.capacityNote || '—'}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(room)} className="mr-2 cursor-pointer">
                      <PencilIcon className="h-4 w-4 text-gray-400 hover:text-cyan-600" />
                    </button>
                    <button onClick={() => handleDelete(room)} className="cursor-pointer">
                      <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RoomsTab
