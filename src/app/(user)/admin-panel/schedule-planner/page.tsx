'use client'

import React, { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { can } from '@/lib/permissions'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useFilterParams } from '@/hooks/useFilterParams'
import { getPlannerConfig, listSchedules } from '@/services/schedulePlannerService'
import { getSchoolByCode } from '@/services/schoolService'
import type { PlannerConfig, ScheduleSummary } from '@/services/types/schedulePlanner'
import TeachersTab from '@/components/schedulePlanner/TeachersTab'
import RoomsTab from '@/components/schedulePlanner/RoomsTab'
import ClassGroupsTab from '@/components/schedulePlanner/ClassGroupsTab'
import DayTemplatesTab from '@/components/schedulePlanner/DayTemplatesTab'
import RulesTab from '@/components/schedulePlanner/RulesTab'
import SchedulesTab from '@/components/schedulePlanner/SchedulesTab'

const TABS = [
  { key: 'schedules', label: 'Schedules' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'classGroups', label: 'Classes & Courses' },
  { key: 'dayTemplates', label: 'School Hours & Blocks' },
  { key: 'rules', label: 'Rules' },
] as const

type TabKey = (typeof TABS)[number]['key']

const isTabKey = (value: string): value is TabKey => TABS.some((tab) => tab.key === value)

const SchedulePlannerContent = () => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const hasHydrated = useUserStore((state) => state.hasHydrated)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  // The active tab lives in the URL (and the page's filter memory); the
  // Schedules tab is the default and is omitted.
  const { get, setParams } = useFilterParams()
  const urlTab = get('tab', 'schedules')
  const activeTab: TabKey = isTabKey(urlTab) ? urlTab : 'schedules'
  const [config, setConfig] = useState<PlannerConfig | null>(null)
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([])
  const [schoolSlug, setSchoolSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [configRes, schedulesRes] = await Promise.all([getPlannerConfig(), listSchedules()])
      if (configRes.status === 'success') setConfig(configRes.data)
      if (schedulesRes.status === 'success') setSchedules(schedulesRes.data)
      setError(null)
    } catch (err) {
      console.error('Error loading planner config:', err)
      setError('Error loading schedule planner data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    if (!user?.school) {
      setError('Unable to determine your school')
      setLoading(false)
      return
    }
    // The planner needs `scheduling` (AuthGuard already enforces it; this
    // also stops the requests below for a session that just lost it).
    if (!can(user, 'scheduling')) {
      router.replace('/dashboard')
      return
    }
    refresh()
    getSchoolByCode(user.school)
      .then((res) => {
        if (res.status === 'success') setSchoolSlug(res.data.slug || null)
      })
      .catch(() => {})
  }, [hasHydrated, user, router, refresh, selectedYearId]) // refetch when the selected school year changes

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold">Schedule Planner</h1>
            <p className="text-gray-600 text-sm mt-1">
              Define teachers, classes and school hours, then build a weekly timetable by hand or
              generate options that satisfy your rules.
            </p>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : config ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setParams({ tab: tab.key === 'schedules' ? null : tab.key })}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                      activeTab === tab.key
                        ? 'text-cyan-700 border-b-2 border-cyan-600'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4 lg:p-6">
                {activeTab === 'schedules' && (
                  <SchedulesTab schedules={schedules} schoolSlug={schoolSlug} onChanged={refresh} teachers={config?.teachers} classGroups={config?.classGroups} />
                )}
                {activeTab === 'teachers' && (
                  <TeachersTab teachers={config.teachers} onChanged={refresh} />
                )}
                {activeTab === 'rooms' && <RoomsTab rooms={config.rooms} onChanged={refresh} />}
                {activeTab === 'classGroups' && (
                  <ClassGroupsTab
                    classGroups={config.classGroups}
                    teachers={config.teachers}
                    rooms={config.rooms}
                    settings={config.settings}
                    onChanged={refresh}
                  />
                )}
                {activeTab === 'dayTemplates' && (
                  <DayTemplatesTab
                    key={JSON.stringify(config.dayTemplates) + JSON.stringify(config.settings)}
                    dayTemplates={config.dayTemplates}
                    fixedBlocks={config.fixedBlocks}
                    classGroups={config.classGroups}
                    settings={config.settings}
                    onChanged={refresh}
                  />
                )}
                {activeTab === 'rules' && (
                  <RulesTab
                    periodRules={config.periodRules ?? []}
                    teachers={config.teachers}
                    classGroups={config.classGroups}
                    onChanged={refresh}
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  )
}

const SchedulePlannerPage = () => (
  <Suspense fallback={<main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen" />}>
    <SchedulePlannerContent />
  </Suspense>
)

export default SchedulePlannerPage
