'use client'

import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ScheduleWeekView from '@/components/schedule/ScheduleWeekView'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

const SchedulePage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Schedule</h1>
                <p className="text-slate-500 mt-1">View and manage weekly class schedules</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                <CalendarDaysIcon className="w-5 h-5 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">Weekly View</span>
              </div>
            </div>
          </div>

          {/* Schedule Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <ScheduleWeekView />
          </div>
        </div>
      </main>
    </>
  )
}

export default SchedulePage
