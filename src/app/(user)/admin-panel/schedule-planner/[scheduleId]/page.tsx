'use client'

// Schedule workspace: generate candidates, browse them, pin sessions,
// regenerate around the pins, save as draft, publish, export PDF.
// scheduleId === 'new' starts a fresh generate session.

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchedulePlannerStore, sessionKey } from '@/store/useSchedulePlannerStore'
import {
  getPlannerConfig,
  getSchedule,
  generateSchedules,
  saveSchedule,
  updateSchedule,
  publishSchedule,
  openSchedulePdf,
} from '@/services/schedulePlannerService'
import type {
  PlannerConfig,
  ScheduleSession,
  SolverDiagnostic,
} from '@/services/types/schedulePlanner'
import WeeklyGrid, { type GridSession } from '@/components/schedulePlanner/WeeklyGrid'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

const ScheduleWorkspacePage = () => {
  const params = useParams<{ scheduleId: string }>()
  const scheduleId = params.scheduleId
  const isNew = scheduleId === 'new'
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const hasHydrated = useUserStore((state) => state.hasHydrated)
  const showNotification = useNotificationStore((s) => s.showNotification)

  const {
    candidates,
    meta,
    activeCandidateIndex,
    workingSessions,
    pinnedKeys,
    viewMode,
    selectedClassGroupId,
    setCandidates,
    selectCandidate,
    loadSessions,
    togglePin,
    setViewMode,
    setSelectedClassGroupId,
    reset,
  } = useSchedulePlannerStore()

  const [config, setConfig] = useState<PlannerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [numCandidates, setNumCandidates] = useState(20)
  const [diagnostics, setDiagnostics] = useState<SolverDiagnostic[] | null>(null)
  const [scheduleName, setScheduleName] = useState('')
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(isNew ? null : scheduleId)
  const [scheduleStatus, setScheduleStatus] = useState<'draft' | 'published' | null>(null)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load config + (existing draft or clean slate)
  useEffect(() => {
    if (!hasHydrated) return
    if (user?.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    const load = async () => {
      try {
        const configRes = await getPlannerConfig()
        if (configRes.status === 'success') setConfig(configRes.data)
        if (!isNew) {
          const scheduleRes = await getSchedule(scheduleId)
          if (scheduleRes.status === 'success') {
            loadSessions(scheduleRes.data.sessions)
            setScheduleName(scheduleRes.data.name)
            setScheduleStatus(scheduleRes.data.status)
          }
        } else {
          reset()
          setScheduleName('')
        }
      } catch (err) {
        console.error('Error loading workspace:', err)
        showNotification('Error loading schedule workspace', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user, scheduleId])

  // Grid frame from config
  const days = useMemo(() => {
    if (!config) return [1, 2, 3, 4, 5]
    const templateDays = config.dayTemplates
      .filter((d) => d.fillableRanges.length > 0)
      .map((d) => d.dayOfWeek)
    if (templateDays.length > 0) return templateDays.sort((a, b) => a - b)
    return [...new Set(workingSessions.map((s) => s.day))].sort((a, b) => a - b)
  }, [config, workingSessions])

  const [rangeStartMin, rangeEndMin] = useMemo(() => {
    const ranges = config?.dayTemplates.flatMap((d) => d.fillableRanges) ?? []
    if (ranges.length > 0) {
      return [Math.min(...ranges.map((r) => r.startMin)), Math.max(...ranges.map((r) => r.endMin))]
    }
    if (workingSessions.length > 0) {
      return [
        Math.min(...workingSessions.map((s) => s.startMin)),
        Math.max(...workingSessions.map((s) => s.endMin)),
      ]
    }
    return [480, 930]
  }, [config, workingSessions])

  const fillableRangesByDay = useMemo(() => {
    const map: Record<number, { startMin: number; endMin: number }[]> = {}
    for (const d of config?.dayTemplates ?? []) map[d.dayOfWeek] = d.fillableRanges
    return map
  }, [config])

  const teacherName = useCallback(
    (id: string) => config?.teachers.find((t) => t.plannerTeacherId === id)?.displayName || '?',
    [config]
  )
  const roomName = useCallback(
    (id?: string | null) => (id ? config?.rooms.find((r) => r.roomId === id)?.name || null : null),
    [config]
  )
  const groupName = useCallback(
    (id: string) => config?.classGroups.find((g) => g.classGroupId === id)?.name || '?',
    [config]
  )

  // Which entity is displayed
  const classGroupIds = useMemo(
    () => [...new Set(workingSessions.map((s) => s.classGroupId))],
    [workingSessions]
  )
  const teacherIds = useMemo(
    () => [...new Set(workingSessions.map((s) => s.teacherId))],
    [workingSessions]
  )
  const activeGroupId = selectedClassGroupId && classGroupIds.includes(selectedClassGroupId)
    ? selectedClassGroupId
    : classGroupIds[0] ?? null
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const activeTeacherId = selectedTeacher && teacherIds.includes(selectedTeacher)
    ? selectedTeacher
    : teacherIds[0] ?? null

  const visibleSessions: GridSession[] = useMemo(() => {
    const filtered =
      viewMode === 'classGroup'
        ? workingSessions.filter((s) => s.classGroupId === activeGroupId)
        : workingSessions.filter((s) => s.teacherId === activeTeacherId)
    return filtered.map((s) => ({
      id: sessionKey(s),
      day: s.day,
      startMin: s.startMin,
      endMin: s.endMin,
      title: s.courseName,
      subtitle: viewMode === 'classGroup' ? teacherName(s.teacherId) : groupName(s.classGroupId),
      roomName: roomName(s.roomId),
      pinned: pinnedKeys.has(sessionKey(s)),
    }))
  }, [workingSessions, viewMode, activeGroupId, activeTeacherId, pinnedKeys, teacherName, groupName, roomName])

  const gridFixedBlocks = useMemo(() => {
    return (config?.fixedBlocks ?? [])
      .filter((b) => !b.classGroupId || viewMode !== 'classGroup' || b.classGroupId === activeGroupId)
      .map((b) => ({ day: b.dayOfWeek, startMin: b.startMin, endMin: b.endMin, label: b.label }))
  }, [config, viewMode, activeGroupId])

  const handleGenerate = async () => {
    setGenerating(true)
    setDiagnostics(null)
    try {
      const pinnedSessions = workingSessions
        .filter((s) => pinnedKeys.has(sessionKey(s)))
        .map((s) => ({
          courseId: s.courseId,
          sessionIndex: s.sessionIndex,
          day: s.day,
          startMin: s.startMin,
          teacherId: s.teacherId,
          roomId: s.roomId,
        }))
      const outcome = await generateSchedules({ numCandidates, pinnedSessions })
      if (outcome.ok) {
        setCandidates(outcome.result.candidates, outcome.result.meta)
        const tight = outcome.result.meta.warnings.find((w) => w.code === 'SCHEDULE_SPACE_TIGHT')
        showNotification(
          `Generated ${outcome.result.meta.returned} schedule${outcome.result.meta.returned === 1 ? '' : 's'}` +
            (tight ? ' — constraints are tight, few variations exist' : ''),
          'success'
        )
      } else {
        setDiagnostics(outcome.failure?.diagnostics ?? [{ code: 'ERROR', message: outcome.message }])
        showNotification(outcome.message, 'error')
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error generating schedules', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const sessionsWithPinFlags = (): ScheduleSession[] =>
    workingSessions.map((s) => ({ ...s, pinned: pinnedKeys.has(sessionKey(s)) }))

  const handleSave = async () => {
    if (workingSessions.length === 0) {
      showNotification('Nothing to save yet — generate a schedule first', 'error')
      return
    }
    let name = scheduleName
    if (!name) {
      const entered = prompt('Name this schedule (e.g. "Fall 2026 v1"):')
      if (!entered?.trim()) return
      name = entered.trim()
      setScheduleName(name)
    }
    setSaving(true)
    try {
      if (currentScheduleId) {
        await updateSchedule(currentScheduleId, { name, sessions: sessionsWithPinFlags() })
        showNotification('Schedule saved', 'success')
      } else {
        const res = await saveSchedule({ name, sessions: sessionsWithPinFlags() })
        if (res.status === 'success') {
          setCurrentScheduleId(res.data.scheduleId)
          setScheduleStatus(res.data.status)
          showNotification('Schedule saved', 'success')
          router.replace(`/admin-panel/schedule-planner/${res.data.scheduleId}`)
        }
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving schedule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!currentScheduleId) {
      showNotification('Save the schedule before publishing', 'error')
      return
    }
    try {
      const res = await publishSchedule(currentScheduleId)
      if (res.status === 'success') {
        setScheduleStatus('published')
        showNotification('Schedule published — teachers and the public link now see it', 'success')
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error publishing schedule', 'error')
    } finally {
      setShowPublishConfirm(false)
    }
  }

  const pinCount = pinnedKeys.size

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/admin-panel/schedule-planner')}
              className="p-1.5 rounded hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold truncate">
                {scheduleName || 'New schedule'}
              </h1>
              {scheduleStatus === 'published' && (
                <span className="text-xs text-green-700 font-semibold">PUBLISHED</span>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Options</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numCandidates}
                    onChange={(e) =>
                      setNumCandidates(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))
                    }
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" /> Generating…
                    </>
                  ) : candidates.length > 0 || workingSessions.length > 0 ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4" /> Regenerate
                      {pinCount > 0 ? ` (keeping ${pinCount} pinned)` : ''}
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" /> Generate
                    </>
                  )}
                </button>

                <div className="flex-1" />

                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                  <button
                    onClick={() => setViewMode('classGroup')}
                    className={`px-3 py-1.5 cursor-pointer ${viewMode === 'classGroup' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    By class
                  </button>
                  <button
                    onClick={() => setViewMode('teacher')}
                    className={`px-3 py-1.5 cursor-pointer ${viewMode === 'teacher' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    By teacher
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || workingSessions.length === 0}
                  className="px-4 py-1.5 border border-cyan-600 text-cyan-700 text-sm font-medium rounded-lg hover:bg-cyan-50 transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </button>
                <button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={!currentScheduleId || scheduleStatus === 'published'}
                  className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-40 cursor-pointer"
                >
                  {scheduleStatus === 'published' ? 'Published' : 'Publish'}
                </button>
                {currentScheduleId && (
                  <button
                    onClick={() => openSchedulePdf(currentScheduleId).catch(() => showNotification('Error exporting PDF', 'error'))}
                    title="Export PDF"
                    className="p-1.5 text-gray-500 hover:text-cyan-600 cursor-pointer"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Infeasibility diagnostics */}
              {diagnostics && (
                <div className="mb-4 border border-red-200 bg-red-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    No valid schedule exists with the current setup:
                  </h3>
                  <ul className="list-disc ml-5 text-sm text-red-700 space-y-0.5">
                    {diagnostics.map((d, i) => (
                      <li key={i}>{d.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Candidate pager */}
              {candidates.length > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => selectCandidate(activeCandidateIndex - 1)}
                    disabled={activeCandidateIndex === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">
                    Option {activeCandidateIndex + 1} of {candidates.length}
                  </span>
                  <button
                    onClick={() => selectCandidate(activeCandidateIndex + 1)}
                    disabled={activeCandidateIndex >= candidates.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                  {meta && (
                    <span className="text-xs text-gray-400">
                      generated in {(meta.elapsedMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    Click a session to pin it, then regenerate to explore around your pins.
                  </span>
                </div>
              )}

              {/* Entity selector */}
              {workingSessions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {viewMode === 'classGroup'
                    ? classGroupIds.map((id) => (
                        <button
                          key={id}
                          onClick={() => setSelectedClassGroupId(id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                            id === activeGroupId
                              ? 'bg-cyan-600 text-white border-cyan-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-cyan-400'
                          }`}
                        >
                          {groupName(id)}
                        </button>
                      ))
                    : teacherIds.map((id) => (
                        <button
                          key={id}
                          onClick={() => setSelectedTeacher(id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                            id === activeTeacherId
                              ? 'bg-cyan-600 text-white border-cyan-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-cyan-400'
                          }`}
                        >
                          {teacherName(id)}
                        </button>
                      ))}
                </div>
              )}

              {/* Grid */}
              {workingSessions.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-3">
                  <WeeklyGrid
                    sessions={visibleSessions}
                    days={days}
                    rangeStartMin={rangeStartMin}
                    rangeEndMin={rangeEndMin}
                    fixedBlocks={gridFixedBlocks}
                    fillableRangesByDay={fillableRangesByDay}
                    onTogglePin={togglePin}
                  />
                </div>
              ) : (
                !generating &&
                !diagnostics && (
                  <div className="text-center py-16 text-gray-400">
                    <SparklesIcon className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm">
                      Hit <span className="font-semibold">Generate</span> to create {numCandidates}{' '}
                      different weekly schedules from your setup.
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>

      {/* Publish confirm */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="font-semibold text-lg mb-2">Publish this schedule?</h3>
            <p className="text-sm text-gray-600 mb-4">
              It becomes the school&apos;s live timetable: teachers see it on their dashboard and the
              public share link starts working. Any previously published schedule is demoted to a
              draft.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-1.5 text-sm text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 cursor-pointer"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ScheduleWorkspacePage
