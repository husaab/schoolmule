'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import {
  createPlannerTeacher,
  updatePlannerTeacher,
  deletePlannerTeacher,
} from '@/services/schedulePlannerService'
import { getTeachersBySchool } from '@/services/teacherService'
import type { TeacherPayload } from '@/services/types/teacher'
import type { PlannerTeacher, TimeWindow } from '@/services/types/schedulePlanner'
import { DAY_LABELS_SHORT, dayLabel, formatMin, minToTimeStr, timeStrToMin } from './timeUtils'

interface TeachersTabProps {
  teachers: PlannerTeacher[]
  onChanged: () => void
}

interface TeacherForm {
  displayName: string
  isFullTime: boolean
  maxWeeklyHours: string
  dailySpareMinutes: string
  maxDaysPerWeek: string
  allowedDays: number[]
  excludedWindows: TimeWindow[]
  notes: string
  userId: string
}

const emptyForm: TeacherForm = {
  displayName: '',
  isFullTime: true,
  maxWeeklyHours: '',
  dailySpareMinutes: '',
  maxDaysPerWeek: '',
  allowedDays: [1, 2, 3, 4, 5],
  excludedWindows: [],
  notes: '',
  userId: '',
}

const TeachersTab: React.FC<TeachersTabProps> = ({ teachers, onChanged }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const user = useUserStore((s) => s.user)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<TeacherForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [userAccounts, setUserAccounts] = useState<TeacherPayload[]>([])

  useEffect(() => {
    if (!user?.school) return
    getTeachersBySchool(user.school)
      .then((res) => {
        if (res.status === 'success') setUserAccounts(res.data)
      })
      .catch(() => {})
  }, [user?.school])

  const startAdd = () => {
    setForm(emptyForm)
    setEditingId('new')
  }

  const startEdit = (t: PlannerTeacher) => {
    setForm({
      displayName: t.displayName,
      isFullTime: t.isFullTime,
      maxWeeklyHours: t.maxWeeklyMinutes != null ? String(t.maxWeeklyMinutes / 60) : '',
      dailySpareMinutes: t.dailySpareMinutes != null ? String(t.dailySpareMinutes) : '',
      maxDaysPerWeek: t.maxDaysPerWeek != null ? String(t.maxDaysPerWeek) : '',
      allowedDays: t.allowedDays,
      excludedWindows: t.excludedWindows,
      notes: t.notes || '',
      userId: t.userId || '',
    })
    setEditingId(t.plannerTeacherId)
  }

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      allowedDays: f.allowedDays.includes(day)
        ? f.allowedDays.filter((d) => d !== day)
        : [...f.allowedDays, day].sort(),
    }))
  }

  const addWindow = () => {
    setForm((f) => ({
      ...f,
      excludedWindows: [...f.excludedWindows, { day: 1, startMin: 720, endMin: 780 }],
    }))
  }

  const updateWindow = (index: number, patch: Partial<TimeWindow>) => {
    setForm((f) => ({
      ...f,
      excludedWindows: f.excludedWindows.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    }))
  }

  const removeWindow = (index: number) => {
    setForm((f) => ({ ...f, excludedWindows: f.excludedWindows.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      showNotification('Teacher name is required', 'error')
      return
    }
    if (form.allowedDays.length === 0) {
      showNotification('Select at least one working day', 'error')
      return
    }
    for (const w of form.excludedWindows) {
      if (w.endMin <= w.startMin) {
        showNotification('Excluded time windows must end after they start', 'error')
        return
      }
    }
    const maxHours = form.maxWeeklyHours.trim() === '' ? null : parseFloat(form.maxWeeklyHours)
    if (maxHours !== null && (!Number.isFinite(maxHours) || maxHours <= 0)) {
      showNotification('Max weekly hours must be a positive number', 'error')
      return
    }
    const spare = form.dailySpareMinutes.trim() === '' ? null : parseInt(form.dailySpareMinutes, 10)
    if (spare !== null && (!Number.isInteger(spare) || spare <= 0)) {
      showNotification('Daily spare must be a positive number of minutes', 'error')
      return
    }
    const maxDays = form.maxDaysPerWeek.trim() === '' ? null : parseInt(form.maxDaysPerWeek, 10)
    if (maxDays !== null && (!Number.isInteger(maxDays) || maxDays < 1 || maxDays > 7)) {
      showNotification('Max days/week must be between 1 and 7', 'error')
      return
    }
    const payload = {
      displayName: form.displayName.trim(),
      isFullTime: form.isFullTime,
      maxWeeklyMinutes: maxHours === null ? null : Math.round(maxHours * 60),
      dailySpareMinutes: spare,
      maxDaysPerWeek: maxDays,
      allowedDays: form.allowedDays,
      excludedWindows: form.excludedWindows,
      notes: form.notes.trim() || null,
      userId: form.userId || null,
    }
    setSaving(true)
    try {
      if (editingId === 'new') {
        await createPlannerTeacher(payload)
        showNotification('Teacher added', 'success')
      } else if (editingId) {
        await updatePlannerTeacher(editingId, payload)
        showNotification('Teacher updated', 'success')
      }
      setEditingId(null)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving teacher', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (t: PlannerTeacher) => {
    if (!confirm(`Remove ${t.displayName} from the planner?`)) return
    try {
      await deletePlannerTeacher(t.plannerTeacherId)
      showNotification('Teacher removed', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error removing teacher', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Teachers available for scheduling, with their weekly limits and availability.
        </p>
        <button
          onClick={startAdd}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> Add teacher
        </button>
      </div>

      {editingId && (
        <div className="border border-cyan-200 bg-cyan-50/40 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">{editingId === 'new' ? 'New teacher' : 'Edit teacher'}</h3>
            <button onClick={() => setEditingId(null)} className="cursor-pointer">
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="Ms. Fatima"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employment</label>
              <select
                value={form.isFullTime ? 'ft' : 'pt'}
                onChange={(e) => setForm((f) => ({ ...f, isFullTime: e.target.value === 'ft' }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="ft">Full-time</option>
                <option value="pt">Part-time</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max hours / week (blank = no limit)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.maxWeeklyHours}
                onChange={(e) => setForm((f) => ({ ...f, maxWeeklyHours: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Daily spare (min/day, blank = none)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={form.dailySpareMinutes}
                onChange={(e) => setForm((f) => ({ ...f, dailySpareMinutes: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max days / week (blank = no limit)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={form.maxDaysPerWeek}
                onChange={(e) => setForm((f) => ({ ...f, maxDaysPerWeek: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                SchoolMule account (shows their schedule on their dashboard)
              </label>
              <select
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="">Not linked</option>
                {userAccounts.map((account) => (
                  <option key={account.userId} value={account.userId}>
                    {account.fullName} ({account.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Working days</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS_SHORT.map((label, i) => (
                <button
                  key={label}
                  onClick={() => toggleDay(i + 1)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                    form.allowedDays.includes(i + 1)
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                Excluded times (teacher unavailable)
              </label>
              <button
                onClick={addWindow}
                className="text-xs text-cyan-700 hover:underline cursor-pointer"
              >
                + Add window
              </button>
            </div>
            {form.excludedWindows.length === 0 && (
              <p className="text-xs text-gray-400">None — available all working hours.</p>
            )}
            {form.excludedWindows.map((w, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <select
                  value={w.day}
                  onChange={(e) => updateWindow(i, { day: parseInt(e.target.value, 10) })}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  {DAY_LABELS_SHORT.map((label, d) => (
                    <option key={label} value={d + 1}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={minToTimeStr(w.startMin)}
                  onChange={(e) => {
                    const v = timeStrToMin(e.target.value)
                    if (v !== null) updateWindow(i, { startMin: v })
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="time"
                  value={minToTimeStr(w.endMin)}
                  onChange={(e) => {
                    const v = timeStrToMin(e.target.value)
                    if (v !== null) updateWindow(i, { endMin: v })
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                />
                <button onClick={() => removeWindow(i)} className="cursor-pointer">
                  <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save teacher'}
          </button>
        </div>
      )}

      {teachers.length === 0 && !editingId ? (
        <p className="text-sm text-gray-400 py-6 text-center">No teachers yet — add your first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Max hrs/wk</th>
                <th className="py-2 pr-4">Spare/day</th>
                <th className="py-2 pr-4">Max days</th>
                <th className="py-2 pr-4">Days</th>
                <th className="py-2 pr-4">Excluded times</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.plannerTeacherId} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium">{t.displayName}</td>
                  <td className="py-2 pr-4">{t.isFullTime ? 'Full-time' : 'Part-time'}</td>
                  <td className="py-2 pr-4">
                    {t.maxWeeklyMinutes != null ? (t.maxWeeklyMinutes / 60).toFixed(1) : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {t.dailySpareMinutes != null ? `${t.dailySpareMinutes} min` : '—'}
                  </td>
                  <td className="py-2 pr-4">{t.maxDaysPerWeek ?? '—'}</td>
                  <td className="py-2 pr-4">
                    {t.allowedDays.map((d) => dayLabel(d, true)).join(', ')}
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {t.excludedWindows.length === 0
                      ? '—'
                      : t.excludedWindows
                          .map((w) => `${dayLabel(w.day, true)} ${formatMin(w.startMin)}–${formatMin(w.endMin)}`)
                          .join('; ')}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(t)} className="mr-2 cursor-pointer">
                      <PencilIcon className="h-4 w-4 text-gray-400 hover:text-cyan-600" />
                    </button>
                    <button onClick={() => handleDelete(t)} className="cursor-pointer">
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

export default TeachersTab
