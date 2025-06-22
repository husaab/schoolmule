'use client'

import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ScheduleWeekView from '@/components/schedule/ScheduleWeekView'

const SchedulePage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="ml-32 pt-40 text-center bg-white min-h-screen p-10">
        <h1 className="text-3xl font-bold mb-6 text-black">Schedule</h1>
        <div className="w-[75%] mx-auto">
            <ScheduleWeekView />
        </div>
      </main>
    </>
  )
}

export default SchedulePage
