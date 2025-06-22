'use client'

import { useEffect, useState } from 'react'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { ScheduleEntry } from '@/services/types/schedule'
import { getSchedulesForWeek } from '@/services/scheduleService'
import { useUserStore } from '@/store/useUserStore'
import ScheduleGrid from './ScheduleGrid'
import ScheduleAddModal from './add/ScheduleAddModal'
import ScheduleDeleteModal from './delete/ScheduleDeleteModal'
import ScheduleEditModal from './edit/ScheduleEditModal'

const ScheduleWeekView = () => {
  const user = useUserStore((s) => s.user)
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showMilitaryTime, setShowMilitaryTime] = useState(false)
  const [deleting, setDeleting] = useState<ScheduleEntry | null>(null);
  const [editing, setEditing] = useState<ScheduleEntry|null>(null)

  const fetchSchedules = async () => {
    try {
      const school = user.school
      if (!school) return
      const isoWeek = format(weekStartDate, 'yyyy-MM-dd')
      const result = await getSchedulesForWeek(school, isoWeek)
      if (result.status === 'success') {
        setSchedules(result.data)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [weekStartDate])

  const handleNextWeek = () => setWeekStartDate((prev) => addWeeks(prev, 1))
  const handlePrevWeek = () => setWeekStartDate((prev) => subWeeks(prev, 1))

  return (
    <div className="text-black flex flex-col h-full">
      {/* Week Controls */}
      <div className="flex justify-center items-center space-x-4 mb-4">
        <button onClick={handlePrevWeek} className="px-3 py-1 border rounded hover:bg-gray-100 cursor-pointer">&larr;</button>
        <h2 className="text-xl font-semibold">Week of {format(weekStartDate, 'MMMM d, yyyy')}</h2>
        <button onClick={handleNextWeek} className="px-3 py-1 border rounded hover:bg-gray-100 cursor-pointer">&rarr;</button>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center justify-between mb-4 space-x-4 sticky top-[5rem] bg-white z-20 py-2 px-2'>
                  <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded cursor-pointer"
        >
          + Add Schedule
        </button>
        <button
          onClick={() => setShowMilitaryTime((prev) => !prev)}
          className="px-3 py-1  bg-cyan-500 text-white text-sm rounded hover:bg-cyan-600 cursor-pointer"
        >
          {showMilitaryTime ? 'Show Standard Time' : 'Show Military Time'}
        </button>
      </div>

      {/* Scrollable Grid Section */}
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] pr-2">
        <ScheduleGrid schedules={schedules} weekStartDate={weekStartDate} showMilitaryTime={showMilitaryTime} onDeleteClick={setDeleting} onEditClick={setEditing}/>
      </div>

      <ScheduleAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={fetchSchedules}
      />

      <ScheduleDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        schedule={deleting!}
        onDeleted={(id) => {
          setDeleting(null);
          fetchSchedules();
        }}
      />

      <ScheduleEditModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        schedule={editing!}
        onUpdated={() => {
          setEditing(null)
          fetchSchedules()
        }}
      />
    </div>
  )
}

export default ScheduleWeekView
