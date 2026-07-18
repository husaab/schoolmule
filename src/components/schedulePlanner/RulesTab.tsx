'use client'

// Period rules: window-based requirements the generator enforces —
// "teacher must teach this class in this window N days/week" (homeroom
// mornings) or "teacher stays free in this window N times/week" (ESL).

import React, { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createPeriodRule, updatePeriodRule, deletePeriodRule } from '@/services/schedulePlannerService'
import type { ClassGroup, PeriodRule, PlannerTeacher } from '@/services/types/schedulePlanner'
import { formatMin, minToTimeStr, timeStrToMin } from './timeUtils'

interface RulesTabProps {
  periodRules: PeriodRule[]
  teachers: PlannerTeacher[]
  classGroups: ClassGroup[]
  onChanged: () => void
}

const RulesTab: React.FC<RulesTabProps> = ({ periodRules, teachers, classGroups, onChanged }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const emptyForm = {
    kind: 'teach' as 'teach' | 'free',
    teacherId: '',
    classGroupId: '',
    startMin: 535,
    endMin: 625,
    minPerWeek: 5,
  }
  const [form, setForm] = useState(emptyForm)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const startEdit = (rule: PeriodRule) => {
    setForm({
      kind: rule.kind,
      teacherId: rule.teacherId,
      classGroupId: rule.classGroupId || '',
      startMin: rule.startMin,
      endMin: rule.endMin,
      minPerWeek: rule.minPerWeek,
    })
    setEditingRuleId(rule.ruleId)
  }

  const cancelEdit = () => {
    setEditingRuleId(null)
    setForm(emptyForm)
  }

  const teacherName = (id: string) =>
    teachers.find((t) => t.plannerTeacherId === id)?.displayName || '?'
  const groupName = (id?: string | null) =>
    classGroups.find((g) => g.classGroupId === id)?.name || '?'

  const handleAdd = async () => {
    if (!form.teacherId) {
      showNotification('Choose a teacher', 'error')
      return
    }
    if (form.kind === 'teach' && !form.classGroupId) {
      showNotification('Teach rules need a class group', 'error')
      return
    }
    if (form.endMin <= form.startMin) {
      showNotification('The window must end after it starts', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        kind: form.kind,
        teacherId: form.teacherId,
        classGroupId: form.kind === 'teach' ? form.classGroupId : null,
        startMin: form.startMin,
        endMin: form.endMin,
        minPerWeek: form.minPerWeek,
      }
      if (editingRuleId) {
        await updatePeriodRule(editingRuleId, payload)
        showNotification('Rule updated', 'success')
        setEditingRuleId(null)
        setForm(emptyForm)
      } else {
        await createPeriodRule(payload)
        showNotification('Rule added', 'success')
      }
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving rule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rule: PeriodRule) => {
    try {
      await deletePeriodRule(rule.ruleId)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error deleting rule', 'error')
    }
  }

  const describe = (rule: PeriodRule) =>
    rule.kind === 'teach'
      ? `${teacherName(rule.teacherId)} teaches ${groupName(rule.classGroupId)} in ${formatMin(rule.startMin)}–${formatMin(rule.endMin)} on ≥ ${rule.minPerWeek} day${rule.minPerWeek === 1 ? '' : 's'}/week`
      : `${teacherName(rule.teacherId)} keeps ≥ ${rule.minPerWeek} period${rule.minPerWeek === 1 ? '' : 's'}/week free in ${formatMin(rule.startMin)}–${formatMin(rule.endMin)}`

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Rules the generator must satisfy: keep homeroom teachers with their class in the morning,
        reserve time for ESL pull-outs, and similar. Rules apply on top of teacher availability.
      </p>

      <div className="border border-cyan-200 bg-cyan-50/40 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Rule type</label>
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as 'teach' | 'free' }))}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="teach">Must teach class in window</option>
              <option value="free">Must be free in window</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Teacher</label>
            <select
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Choose…</option>
              {teachers.map((t) => (
                <option key={t.plannerTeacherId} value={t.plannerTeacherId}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>
          {form.kind === 'teach' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Class</label>
              <select
                value={form.classGroupId}
                onChange={(e) => setForm((f) => ({ ...f, classGroupId: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="">Choose…</option>
                {classGroups.map((g) => (
                  <option key={g.classGroupId} value={g.classGroupId}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Window from</label>
            <input
              type="time"
              value={minToTimeStr(form.startMin)}
              onChange={(e) => {
                const v = timeStrToMin(e.target.value)
                if (v !== null) setForm((f) => ({ ...f, startMin: v }))
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">to</label>
            <input
              type="time"
              value={minToTimeStr(form.endMin)}
              onChange={(e) => {
                const v = timeStrToMin(e.target.value)
                if (v !== null) setForm((f) => ({ ...f, endMin: v }))
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {form.kind === 'teach' ? 'Days/week (min)' : 'Periods/week (min)'}
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={form.minPerWeek}
              onChange={(e) =>
                setForm((f) => ({ ...f, minPerWeek: Math.min(7, Math.max(1, parseInt(e.target.value, 10) || 1)) }))
              }
              className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
          >
            {editingRuleId ? (
              saving ? 'Saving…' : 'Save changes'
            ) : (
              <>
                <PlusIcon className="h-4 w-4" /> Add rule
              </>
            )}
          </button>
          {editingRuleId && (
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 cursor-pointer"
            >
              <XMarkIcon className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
        {editingRuleId && (
          <p className="text-xs text-cyan-700 mt-2">Editing an existing rule — save or cancel.</p>
        )}
      </div>

      {periodRules.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No rules yet.</p>
      ) : (
        <div className="space-y-2">
          {periodRules.map((rule) => (
            <div
              key={rule.ruleId}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0 ${
                    rule.kind === 'teach' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {rule.kind === 'teach' ? 'Teach' : 'Free'}
                </span>
                <span className="text-sm truncate">{describe(rule)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(rule)} className="cursor-pointer">
                  <PencilIcon className="h-4 w-4 text-gray-400 hover:text-cyan-600" />
                </button>
                <button onClick={() => handleDelete(rule)} className="cursor-pointer">
                  <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RulesTab
