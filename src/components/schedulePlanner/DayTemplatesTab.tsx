'use client'

// School hours (fillable ranges per day), fixed blocks (lunch/recess/prayer),
// and the two solver settings (default course length + snap increment).

import React, { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  replaceDayTemplates,
  updatePlannerSettings,
  createFixedBlock,
  deleteFixedBlock,
} from '@/services/schedulePlannerService'
import type {
  ClassGroup,
  DayTemplate,
  FixedBlock,
  PlannerSettings,
} from '@/services/types/schedulePlanner'
import { DAY_LABELS, DAY_LABELS_SHORT, dayLabel, formatMin, minToTimeStr, timeStrToMin } from './timeUtils'

interface DayTemplatesTabProps {
  dayTemplates: DayTemplate[]
  fixedBlocks: FixedBlock[]
  classGroups: ClassGroup[]
  settings: PlannerSettings
  onChanged: () => void
}

const DayTemplatesTab: React.FC<DayTemplatesTabProps> = ({
  dayTemplates,
  fixedBlocks,
  classGroups,
  settings,
  onChanged,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [days, setDays] = useState<DayTemplate[]>(
    dayTemplates.length > 0
      ? dayTemplates
      : [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, fillableRanges: [] }))
  )
  const [savingDays, setSavingDays] = useState(false)
  const [defaultDuration, setDefaultDuration] = useState(String(settings.defaultDurationMinutes))
  const [snap, setSnap] = useState(String(settings.snapMinutes))
  const [blockForm, setBlockForm] = useState({
    label: '',
    dayOfWeek: 0, // 0 = every listed day
    startMin: 720,
    endMin: 760,
    classGroupId: '',
  })

  const activeDayNumbers = days.filter((d) => d.fillableRanges.length > 0).map((d) => d.dayOfWeek)

  const updateRange = (dayIdx: number, rangeIdx: number, patch: Partial<{ startMin: number; endMin: number }>) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              fillableRanges: d.fillableRanges.map((r, j) => (j === rangeIdx ? { ...r, ...patch } : r)),
            }
          : d
      )
    )
  }

  const addRange = (dayIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, fillableRanges: [...d.fillableRanges, { startMin: 510, endMin: 930 }] }
          : d
      )
    )
  }

  const removeRange = (dayIdx: number, rangeIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, fillableRanges: d.fillableRanges.filter((_, j) => j !== rangeIdx) } : d
      )
    )
  }

  const addDay = () => {
    const used = new Set(days.map((d) => d.dayOfWeek))
    const next = [1, 2, 3, 4, 5, 6, 7].find((d) => !used.has(d))
    if (next) setDays((prev) => [...prev, { dayOfWeek: next, fillableRanges: [] }].sort((a, b) => a.dayOfWeek - b.dayOfWeek))
  }

  const handleSaveDays = async () => {
    for (const d of days) {
      for (const r of d.fillableRanges) {
        if (r.endMin <= r.startMin) {
          showNotification(`${dayLabel(d.dayOfWeek)}: a time range ends before it starts`, 'error')
          return
        }
      }
    }
    setSavingDays(true)
    try {
      await replaceDayTemplates(days.filter((d) => d.fillableRanges.length > 0))
      showNotification('School hours saved', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving school hours', 'error')
    } finally {
      setSavingDays(false)
    }
  }

  const handleSaveSettings = async () => {
    const dur = parseInt(defaultDuration, 10)
    const snapVal = parseInt(snap, 10)
    if (!Number.isInteger(dur) || dur < 5) {
      showNotification('Default course length must be at least 5 minutes', 'error')
      return
    }
    try {
      await updatePlannerSettings({ defaultDurationMinutes: dur, snapMinutes: snapVal })
      showNotification('Settings saved', 'success')
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error saving settings', 'error')
    }
  }

  const handleAddBlock = async () => {
    if (!blockForm.label.trim()) {
      showNotification('Block label is required (e.g. Lunch)', 'error')
      return
    }
    if (blockForm.endMin <= blockForm.startMin) {
      showNotification('Block must end after it starts', 'error')
      return
    }
    const targetDays = blockForm.dayOfWeek === 0 ? activeDayNumbers : [blockForm.dayOfWeek]
    if (targetDays.length === 0) {
      showNotification('Set school hours first so there are days to add the block to', 'error')
      return
    }
    try {
      for (const day of targetDays) {
        await createFixedBlock({
          label: blockForm.label.trim(),
          dayOfWeek: day,
          startMin: blockForm.startMin,
          endMin: blockForm.endMin,
          classGroupId: blockForm.classGroupId || null,
        })
      }
      showNotification('Fixed block added', 'success')
      setBlockForm((f) => ({ ...f, label: '' }))
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error adding block', 'error')
    }
  }

  const handleDeleteBlock = async (block: FixedBlock) => {
    try {
      await deleteFixedBlock(block.fixedBlockId)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error deleting block', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Solver settings */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Defaults</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Default course length (min)</label>
            <input
              type="number"
              min="5"
              step="5"
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(e.target.value)}
              className="w-32 border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start times snap to</label>
            <select
              value={snap}
              onChange={(e) => setSnap(e.target.value)}
              className="w-32 border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="1">1 minute</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition cursor-pointer"
          >
            Save defaults
          </button>
        </div>
      </div>

      {/* School hours */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold">School hours</h3>
            <p className="text-xs text-gray-500">
              The time windows the generator fills with classes, per day. Days without ranges are skipped.
            </p>
          </div>
          <button onClick={addDay} className="text-xs text-cyan-700 hover:underline cursor-pointer">
            + Add day
          </button>
        </div>
        {days.map((d, dayIdx) => (
          <div key={d.dayOfWeek} className="flex items-start gap-3 py-2 border-t border-gray-100">
            <div className="w-24 pt-1 text-sm font-medium">{DAY_LABELS[d.dayOfWeek - 1]}</div>
            <div className="flex-1">
              {d.fillableRanges.length === 0 && (
                <span className="text-xs text-gray-400">No school (not scheduled)</span>
              )}
              {d.fillableRanges.map((r, rangeIdx) => (
                <div key={rangeIdx} className="flex items-center gap-2 mb-1">
                  <input
                    type="time"
                    value={minToTimeStr(r.startMin)}
                    onChange={(e) => {
                      const v = timeStrToMin(e.target.value)
                      if (v !== null) updateRange(dayIdx, rangeIdx, { startMin: v })
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="time"
                    value={minToTimeStr(r.endMin)}
                    onChange={(e) => {
                      const v = timeStrToMin(e.target.value)
                      if (v !== null) updateRange(dayIdx, rangeIdx, { endMin: v })
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                  />
                  <button onClick={() => removeRange(dayIdx, rangeIdx)} className="cursor-pointer">
                    <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addRange(dayIdx)}
                className="text-xs text-cyan-700 hover:underline cursor-pointer"
              >
                + Add time range
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={handleSaveDays}
          disabled={savingDays}
          className="mt-3 px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
        >
          {savingDays ? 'Saving…' : 'Save school hours'}
        </button>
      </div>

      {/* Fixed blocks */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-1">Fixed blocks</h3>
        <p className="text-xs text-gray-500 mb-3">
          Times nothing can be scheduled — lunch, recess, prayer. School-wide or for one class group.
        </p>
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Label</label>
            <input
              type="text"
              value={blockForm.label}
              onChange={(e) => setBlockForm((f) => ({ ...f, label: e.target.value }))}
              className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="Lunch"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Day</label>
            <select
              value={blockForm.dayOfWeek}
              onChange={(e) => setBlockForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value, 10) }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0}>Every school day</option>
              {DAY_LABELS_SHORT.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="time"
              value={minToTimeStr(blockForm.startMin)}
              onChange={(e) => {
                const v = timeStrToMin(e.target.value)
                if (v !== null) setBlockForm((f) => ({ ...f, startMin: v }))
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="time"
              value={minToTimeStr(blockForm.endMin)}
              onChange={(e) => {
                const v = timeStrToMin(e.target.value)
                if (v !== null) setBlockForm((f) => ({ ...f, endMin: v }))
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Applies to</label>
            <select
              value={blockForm.classGroupId}
              onChange={(e) => setBlockForm((f) => ({ ...f, classGroupId: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Whole school</option>
              {classGroups.map((g) => (
                <option key={g.classGroupId} value={g.classGroupId}>
                  {g.name} only
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddBlock}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" /> Add
          </button>
        </div>
        {fixedBlocks.length === 0 ? (
          <p className="text-sm text-gray-400">No fixed blocks.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fixedBlocks.map((b) => (
              <span
                key={b.fixedBlockId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs"
              >
                <span className="font-medium">{b.label}</span>
                <span className="text-gray-500">
                  {dayLabel(b.dayOfWeek, true)} {formatMin(b.startMin)}–{formatMin(b.endMin)}
                </span>
                {b.classGroupId && (
                  <span className="text-cyan-700">
                    ({classGroups.find((g) => g.classGroupId === b.classGroupId)?.name || '?'})
                  </span>
                )}
                <button onClick={() => handleDeleteBlock(b)} className="cursor-pointer">
                  <TrashIcon className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DayTemplatesTab
