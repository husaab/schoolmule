'use client'

// Saved schedule drafts + the published one, with entry points into the
// generate/browse workspace.

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  PencilSquareIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import { deleteSchedule, updateSchedule } from '@/services/schedulePlannerService'
import type { ScheduleSummary } from '@/services/types/schedulePlanner'
import PrintMenu from './PrintMenu'

interface SchedulesTabProps {
  schedules: ScheduleSummary[]
  schoolSlug?: string | null
  onChanged: () => void
}

const SchedulesTab: React.FC<SchedulesTabProps> = ({ schedules, schoolSlug, onChanged }) => {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)

  const handleDelete = async (schedule: ScheduleSummary) => {
    if (!confirm(`Delete "${schedule.name}"?${schedule.status === 'published' ? ' It is currently published — the live link will stop working.' : ''}`)) return
    try {
      await deleteSchedule(schedule.scheduleId)
      showNotification('Schedule deleted', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error deleting schedule', 'error')
    }
  }

  const handleRename = async (schedule: ScheduleSummary) => {
    const name = prompt('Rename schedule:', schedule.name)
    if (!name?.trim() || name.trim() === schedule.name) return
    try {
      await updateSchedule(schedule.scheduleId, { name: name.trim() })
      showNotification('Schedule renamed', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error renaming schedule', 'error')
    }
  }

  const copyShareLink = (schedule: ScheduleSummary) => {
    if (!schoolSlug) {
      showNotification('School slug not configured — ask support to set one', 'error')
      return
    }
    const url = `${window.location.origin}/${schoolSlug}/schedule/${schedule.shareToken}`
    navigator.clipboard.writeText(url)
    showNotification('Public link copied to clipboard', 'success')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Saved schedules. Publish one to make it live for teachers and the public link.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin-panel/schedule-planner/new?manual=1')}
            title="Enter a timetable you already run, without the solver"
            className="flex items-center gap-1 px-3 py-1.5 border border-cyan-600 text-cyan-700 text-sm rounded-lg hover:bg-cyan-50 transition cursor-pointer"
          >
            <PencilSquareIcon className="h-4 w-4" /> Build manually
          </button>
          <button
            onClick={() => router.push('/admin-panel/schedule-planner/new')}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" /> Generate new schedule
          </button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No saved schedules yet. Configure teachers, classes, and school hours, then generate.
        </p>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div
              key={s.scheduleId}
              onClick={() => router.push(`/admin-panel/schedule-planner/${s.scheduleId}`)}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  {s.status === 'published' ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full uppercase">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded-full uppercase">
                      Draft
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Updated {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </div>
              {/* Row click opens the workspace; action buttons must not bubble */}
              <div className="flex items-center gap-2 shrink-0">
                {s.status === 'published' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyShareLink(s)
                    }}
                    title="Copy public link"
                    className="p-1.5 text-gray-400 hover:text-cyan-600 cursor-pointer"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin-panel/schedule-planner/${s.scheduleId}?variations=1`)
                  }}
                  title="Generate variations of this schedule"
                  className="p-1.5 text-gray-400 hover:text-cyan-600 cursor-pointer"
                >
                  <SparklesIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRename(s)
                  }}
                  title="Rename"
                  className="p-1.5 text-gray-400 hover:text-cyan-600 cursor-pointer"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <PrintMenu scheduleId={s.scheduleId} iconOnly />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(s)
                  }}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SchedulesTab
