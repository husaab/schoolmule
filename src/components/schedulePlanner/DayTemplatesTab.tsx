'use client'

// School hours (fillable ranges per day), fixed blocks (lunch/recess/prayer),
// and the two solver settings (default course length + snap increment).

import React, { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  replaceDayTemplates,
  updatePlannerSettings,
  createFixedBlock,
  updateFixedBlock,
  deleteFixedBlock,
} from '@/services/schedulePlannerService'
import type {
  ClassGroup,
  DayTemplate,
  FixedBlock,
  PlannerSettings,
} from '@/services/types/schedulePlanner'
import { DAY_LABELS, dayLabel, formatMin, minToTimeStr, timeStrToMin } from './timeUtils'

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
    days: [] as number[], // empty = every school day
    startMin: 720,
    endMin: 760,
    classGroupIds: [] as string[], // empty = whole school
  })

  const toggleBlockGroup = (id: string) => {
    setBlockForm((f) => ({
      ...f,
      classGroupIds: f.classGroupIds.includes(id)
        ? f.classGroupIds.filter((x) => x !== id)
        : [...f.classGroupIds, id],
    }))
  }

  const toggleBlockDay = (day: number) => {
    setBlockForm((f) => ({
      ...f,
      days: f.days.includes(day)
        ? f.days.filter((d) => d !== day)
        : [...f.days, day].sort((a, b) => a - b),
    }))
  }

  // Identical blocks across days (same label/time/groups — e.g. from "Every
  // school day") are shown and edited as ONE entry.
  const groupedBlocks = React.useMemo(() => {
    const map = new Map<string, FixedBlock[]>()
    for (const b of fixedBlocks) {
      const key = `${b.label}|${b.startMin}|${b.endMin}|${[...b.classGroupIds].sort().join(',')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b)
    }
    return [...map.values()].map((blocks) => blocks.sort((a, b) => a.dayOfWeek - b.dayOfWeek))
  }, [fixedBlocks])

  const daysSummary = (blocks: FixedBlock[]) => {
    const blockDays = blocks.map((b) => b.dayOfWeek)
    if (
      activeDayNumbers.length > 1 &&
      activeDayNumbers.every((d) => blockDays.includes(d)) &&
      blockDays.length === activeDayNumbers.length
    ) {
      return 'Every school day'
    }
    return blockDays.map((d) => dayLabel(d, true)).join(', ')
  }

  // Edit-block modal state (edits every block in the group at once)
  const [editingBlocks, setEditingBlocks] = useState<FixedBlock[] | null>(null)
  const [editForm, setEditForm] = useState({
    label: '',
    days: [] as number[],
    startMin: 720,
    endMin: 760,
    classGroupIds: [] as string[],
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const startEditBlock = (blocks: FixedBlock[]) => {
    setEditForm({
      label: blocks[0].label,
      days: blocks.map((b) => b.dayOfWeek),
      startMin: blocks[0].startMin,
      endMin: blocks[0].endMin,
      classGroupIds: [...blocks[0].classGroupIds],
    })
    setEditingBlocks(blocks)
  }

  const toggleEditGroup = (id: string) => {
    setEditForm((f) => ({
      ...f,
      classGroupIds: f.classGroupIds.includes(id)
        ? f.classGroupIds.filter((x) => x !== id)
        : [...f.classGroupIds, id],
    }))
  }

  const toggleEditDay = (day: number) => {
    setEditForm((f) => ({
      ...f,
      days: f.days.includes(day)
        ? f.days.filter((d) => d !== day)
        : [...f.days, day].sort((a, b) => a - b),
    }))
  }

  // Saves the day set as a diff: kept days are updated in place, removed
  // days are deleted, newly added days get fresh rows.
  const handleSaveEdit = async () => {
    if (!editingBlocks) return
    if (!editForm.label.trim()) {
      showNotification('Block label is required', 'error')
      return
    }
    if (editForm.endMin <= editForm.startMin) {
      showNotification('Block must end after it starts', 'error')
      return
    }
    if (editForm.days.length === 0) {
      showNotification('Select at least one day', 'error')
      return
    }
    setSavingEdit(true)
    try {
      const existingByDay = new Map(editingBlocks.map((b) => [b.dayOfWeek, b]))
      const shared = {
        label: editForm.label.trim(),
        startMin: editForm.startMin,
        endMin: editForm.endMin,
        classGroupIds: editForm.classGroupIds,
      }
      for (const day of editForm.days) {
        const existing = existingByDay.get(day)
        if (existing) {
          await updateFixedBlock(existing.fixedBlockId, { ...shared, dayOfWeek: day })
        } else {
          await createFixedBlock({ ...shared, dayOfWeek: day })
        }
      }
      for (const [day, block] of existingByDay) {
        if (!editForm.days.includes(day)) {
          await deleteFixedBlock(block.fixedBlockId)
        }
      }
      showNotification('Fixed block updated', 'success')
      setEditingBlocks(null)
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error updating block', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

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
    const targetDays = blockForm.days.length > 0 ? blockForm.days : activeDayNumbers
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
          classGroupIds: blockForm.classGroupIds,
        })
      }
      showNotification('Fixed block added', 'success')
      setBlockForm((f) => ({ ...f, label: '' }))
      onChanged()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error adding block', 'error')
    }
  }

  const handleDeleteBlocks = async (blocks: FixedBlock[]) => {
    if (
      blocks.length > 1 &&
      !confirm(`Remove "${blocks[0].label}" on all ${blocks.length} days?`)
    ) {
      return
    }
    try {
      for (const block of blocks) {
        await deleteFixedBlock(block.fixedBlockId)
      }
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
          Times nothing can be scheduled — lunch, recess, prayer. School-wide or for selected class groups.
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
            <label className="block text-xs text-gray-600 mb-1">
              Days (none selected = every school day)
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setBlockForm((f) => ({ ...f, days: [] }))}
                className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                  blockForm.days.length === 0
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-gray-500 border-gray-300'
                }`}
              >
                Every school day
              </button>
              {activeDayNumbers.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleBlockDay(day)}
                  className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                    blockForm.days.includes(day)
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  {dayLabel(day, true)}
                </button>
              ))}
            </div>
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
            <label className="block text-xs text-gray-600 mb-1">
              Applies to (none selected = whole school)
            </label>
            <div className="flex flex-wrap gap-1 max-w-md">
              <button
                onClick={() => setBlockForm((f) => ({ ...f, classGroupIds: [] }))}
                className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                  blockForm.classGroupIds.length === 0
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-gray-500 border-gray-300'
                }`}
              >
                Whole school
              </button>
              {classGroups.map((g) => (
                <button
                  key={g.classGroupId}
                  onClick={() => toggleBlockGroup(g.classGroupId)}
                  className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                    blockForm.classGroupIds.includes(g.classGroupId)
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
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
            {groupedBlocks.map((blocks) => (
              <span
                key={blocks[0].fixedBlockId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs"
              >
                <span className="font-medium">{blocks[0].label}</span>
                <span className="text-gray-500">
                  {daysSummary(blocks)} {formatMin(blocks[0].startMin)}–{formatMin(blocks[0].endMin)}
                </span>
                {blocks[0].classGroupIds.length > 0 && (
                  <span className="text-cyan-700">
                    (
                    {blocks[0].classGroupIds
                      .map((id) => classGroups.find((g) => g.classGroupId === id)?.name || '?')
                      .join(', ')}
                    )
                  </span>
                )}
                <button onClick={() => startEditBlock(blocks)} className="cursor-pointer">
                  <PencilIcon className="h-3.5 w-3.5 text-gray-400 hover:text-cyan-600" />
                </button>
                <button onClick={() => handleDeleteBlocks(blocks)} className="cursor-pointer">
                  <TrashIcon className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit fixed block modal */}
      {editingBlocks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Edit fixed block</h3>
              <button onClick={() => setEditingBlocks(null)} className="cursor-pointer">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Days</label>
                <div className="flex flex-wrap gap-1">
                  {[...new Set([...activeDayNumbers, ...editingBlocks.map((b) => b.dayOfWeek)])]
                    .sort((a, b) => a - b)
                    .map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleEditDay(day)}
                      className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                        editForm.days.includes(day)
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-gray-500 border-gray-300'
                      }`}
                    >
                        {dayLabel(day, true)}
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="time"
                  value={minToTimeStr(editForm.startMin)}
                  onChange={(e) => {
                    const v = timeStrToMin(e.target.value)
                    if (v !== null) setEditForm((f) => ({ ...f, startMin: v }))
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="time"
                  value={minToTimeStr(editForm.endMin)}
                  onChange={(e) => {
                    const v = timeStrToMin(e.target.value)
                    if (v !== null) setEditForm((f) => ({ ...f, endMin: v }))
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">
                Applies to (none selected = whole school)
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setEditForm((f) => ({ ...f, classGroupIds: [] }))}
                  className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                    editForm.classGroupIds.length === 0
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  Whole school
                </button>
                {classGroups.map((g) => (
                  <button
                    key={g.classGroupId}
                    onClick={() => toggleEditGroup(g.classGroupId)}
                    className={`px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                      editForm.classGroupIds.includes(g.classGroupId)
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-gray-500 border-gray-300'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingBlocks(null)}
                className="px-4 py-1.5 text-sm text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 cursor-pointer"
              >
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DayTemplatesTab
