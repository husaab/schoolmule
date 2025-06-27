'use client'

import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ScheduleWeekView from '@/components/schedule/ScheduleWeekView'

const SchedulePage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 text-center bg-white min-h-screen p-4 lg:p-4 lg:p-10">
        <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-black">Schedule</h1>
        <div className="w-full lg:w-[90%] xl:w-[75%] mx-auto">
            <ScheduleWeekView />
        </div>
      </main>
    </>
  )
}

export default SchedulePage
