'use client'

// Copy with new times: keep a timetable, change its bell times (daylight
// saving). The admin edits each bell's periods and breaks — or pastes the list
// the school wrote — and the server moves every class with its period and
// checks for clashes (services/scheduleRetime). The copy is saved as a draft
// that carries its own breaks and school hours, optionally going live on a date.
// State lives in useCopyWithTimes, shared with the app's sheet.

import React from 'react'
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { ScheduleDraft, TimeRange } from '@/services/types/schedulePlanner'
import { bellRange, formatDay, goLiveNote, isTimeChanged, retimeSummary, torontoToday } from '@/lib/bellTimes'
import { useCopyWithTimes } from '@/hooks/useCopyWithTimes'
import { dayLabel, minToTimeStr, timeStrToMin } from './timeUtils'

interface CopyWithTimesModalProps {
  /** The schedule to copy; null keeps the modal closed. */
  scheduleId: string | null
  onClose: () => void
  onCreated: (schedule: ScheduleDraft) => void
}

const smallField =
  'rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'

const TimeInputs = ({
  value,
  onChange,
  onBlur,
  changed,
  label,
}: {
  value: TimeRange
  onChange: (next: TimeRange) => void
  onBlur: () => void
  changed: boolean
  label: string
}) => {
  const tone = changed ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-800'
  const field = `w-[8rem] rounded-lg border px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-cyan-500 ${tone}`
  return (
    <div className="flex items-center gap-1">
      <input
        type="time"
        aria-label={`${label} start`}
        className={field}
        value={minToTimeStr(value.startMin)}
        onBlur={onBlur}
        onChange={(e) => {
          const m = timeStrToMin(e.target.value)
          if (m != null) onChange({ ...value, startMin: m })
        }}
      />
      <span className="text-slate-400">–</span>
      <input
        type="time"
        aria-label={`${label} end`}
        className={field}
        value={minToTimeStr(value.endMin)}
        onBlur={onBlur}
        onChange={(e) => {
          const m = timeStrToMin(e.target.value)
          if (m != null) onChange({ ...value, endMin: m })
        }}
      />
    </div>
  )
}

const CopyWithTimesModal: React.FC<CopyWithTimesModalProps> = ({ scheduleId, onClose, onCreated }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const copy = useCopyWithTimes(scheduleId)
  const { model, bells, bell, preview } = copy
  const summary = preview ? retimeSummary(preview) : null
  const warnings = preview?.warnings ?? []

  const handleCreate = async () => {
    try {
      const schedule = await copy.create()
      showNotification(
        copy.goLiveMode === 'date'
          ? `Copy saved. It goes live ${formatDay(copy.goLiveOn)}.`
          : 'Copy saved as a draft. Publish it when you are ready.',
        'success'
      )
      onCreated(schedule)
      onClose()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not save the copy', 'error')
    }
  }

  return (
    <Modal
      isOpen={!!scheduleId}
      onClose={onClose}
      style="w-full max-w-6xl"
      maxHeightClass="max-h-[94vh]"
      fullScreenOnMobile
      closeOnEscape
      ariaLabel="Copy with new times"
    >
      <ModalHeader
        title="Copy with new times"
        icon={ClockIcon}
        subtitle={
          model ? (
            <>
              From <span className="font-medium text-slate-700">{model.schedule.name}</span>. Classes and teachers
              stay the same; each class moves with its period.
            </>
          ) : (
            'Loading bell times…'
          )
        }
      />

      {copy.loadError && <p className="px-6 py-8 text-sm text-rose-600">{copy.loadError}</p>}
      {!model && !copy.loadError && <p className="px-6 py-8 text-sm text-slate-500">Loading bell times…</p>}

      {model && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {/* Editor */}
          <div className="min-w-0 space-y-4 px-6 py-5 lg:border-r lg:border-slate-100">
            {copy.hoursView.map(({ hours: h, now, next }) => (
              <div key={h.rowId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    School day{model.hours.length > 1 ? ` (${h.days.map((d) => dayLabel(d, true)).join(', ')})` : ''}
                  </p>
                  <p className="text-xs text-slate-500">Now {bellRange(h.startMin, h.endMin)}</p>
                </div>
                <TimeInputs
                  label="School day"
                  value={next}
                  changed={isTimeChanged(next, now)}
                  onChange={(t) => copy.setHoursTime(h.rowId, t)}
                  onBlur={copy.resort}
                />
              </div>
            ))}

            {bells.length > 1 && (
              <div role="tablist" aria-label="Bell schedules" className="flex flex-wrap gap-2">
                {bells.map((b, i) => (
                  <button
                    key={b.bellId}
                    role="tab"
                    aria-selected={i === copy.bellIndex}
                    onClick={() => copy.setBellIndex(i)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      i === copy.bellIndex
                        ? 'border-cyan-600 bg-cyan-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            {bell && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2 pr-3 font-semibold">Bell</th>
                      <th className="py-2 pr-3 font-semibold">Now</th>
                      <th className="py-2 pr-3 font-semibold">New time</th>
                      <th className="py-2" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {copy.rowsView.map((item) =>
                      item.kind === 'row' ? (
                        <tr key={item.key} className={`border-t border-slate-100 ${item.removed ? 'opacity-50' : ''}`}>
                          <td className="py-2 pr-3">
                            <span className={`font-medium ${item.row.kind === 'period' ? 'text-slate-800' : 'text-slate-600'}`}>
                              {item.row.label}
                            </span>
                            {item.row.kind === 'period' ? (
                              <span className="ml-2 text-xs text-slate-400">{item.row.sessionCount} classes</span>
                            ) : (
                              item.row.classGroupIds?.length === 0 && (
                                <span className="ml-2 text-xs text-slate-400">all grades</span>
                              )
                            )}
                          </td>
                          <td className="py-2 pr-3 tabular-nums text-slate-500">{bellRange(item.now.startMin, item.now.endMin)}</td>
                          <td className="py-2 pr-3">
                            {item.removed ? (
                              <span className="text-xs font-medium text-rose-600">Removed in the copy</span>
                            ) : (
                              <TimeInputs
                                label={item.row.label}
                                value={item.next}
                                changed={isTimeChanged(item.next, item.now)}
                                onChange={(t) => copy.setRowTime(item.row.rowId, t)}
                                onBlur={copy.resort}
                              />
                            )}
                          </td>
                          <td className="py-2 text-right">
                            {item.row.kind === 'break' &&
                              (item.removed ? (
                                <button
                                  onClick={() => copy.setRowRemoved(item.row.rowId, false)}
                                  title="Keep this break"
                                  className="cursor-pointer p-1.5 text-slate-400 hover:text-cyan-600"
                                >
                                  <ArrowUturnLeftIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => copy.setRowRemoved(item.row.rowId, true)}
                                  title="Remove this break from the copy"
                                  className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-500"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              ))}
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.key} className="border-t border-slate-100">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <input
                                aria-label="New break name"
                                placeholder="Break name"
                                value={item.added.label}
                                onChange={(e) => copy.updateAdded(item.key, { label: e.target.value })}
                                className="w-36 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700">New</span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-slate-400">None</td>
                          <td className="py-2 pr-3">
                            <TimeInputs
                              label={item.added.label || 'New break'}
                              value={item.next}
                              changed
                              onChange={(t) => copy.updateAdded(item.key, t)}
                              onBlur={copy.resort}
                            />
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => copy.removeAdded(item.key)}
                              title="Remove this new break"
                              className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copy.addBreak}>
                <PlusIcon className="h-4 w-4" /> Add break
              </Button>
              <Button variant="secondary" onClick={() => copy.setPasteOpen(!copy.pasteOpen)} aria-expanded={copy.pasteOpen}>
                <ClipboardDocumentListIcon className="h-4 w-4" /> Paste times from a message
              </Button>
            </div>

            {copy.pasteOpen && bell && (
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <label htmlFor="bell-paste" className="block text-sm font-medium text-slate-700">
                  Paste the list for {bell.label}
                </label>
                <textarea
                  id="bell-paste"
                  rows={6}
                  value={copy.pasteText}
                  onChange={(e) => copy.setPasteText(e.target.value)}
                  placeholder={'8:40–8:50 — Assembly\n8:50–9:40 — 1st Period\n9:40–9:55 — Snack'}
                  className={`${inputClass} font-mono text-xs`}
                />
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={copy.fillFromPaste} disabled={!copy.pasteText.trim()}>
                    Fill in {bell.label}
                  </Button>
                </div>
              </div>
            )}
            {copy.pasteNote && <p className="text-xs text-slate-500">{copy.pasteNote}</p>}
          </div>

          {/* Stays beside the list while it scrolls; top clears the sticky header. */}
          <aside className="space-y-4 px-6 py-5 lg:sticky lg:top-[5.75rem] lg:self-start" aria-live="polite">
            {copy.invalid ? (
              <p className="text-sm text-rose-600">Each time needs a start before its end, and new breaks need a name.</p>
            ) : copy.previewError ? (
              <div className="space-y-2">
                <p className="text-sm text-rose-600">{copy.previewError}</p>
                <Button variant="secondary" onClick={copy.recheck}>
                  Check again
                </Button>
              </div>
            ) : !preview || !summary ? (
              <p className="text-sm text-slate-500">Checking…</p>
            ) : (
              <>
                <div className={copy.checking ? 'opacity-60 transition-opacity' : ''}>
                  <p className="text-base font-semibold text-slate-900">{summary.moved}</p>
                  <p className="text-xs text-slate-500">{summary.of}</p>
                </div>
                {warnings.length === 0 ? (
                  <div className="flex gap-2 text-emerald-700">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{summary.clear}</p>
                      <p className="text-xs text-emerald-800/80">{summary.clearDetail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <p className="text-sm font-semibold">{summary.check}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {warnings.slice(0, 8).map((w, i) => (
                        <li key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          {w.message}
                        </li>
                      ))}
                    </ul>
                    {warnings.length > 8 && <p className="text-xs text-amber-800">and {warnings.length - 8} more</p>}
                    <p className="text-xs text-slate-500">{summary.checkNote}</p>
                  </div>
                )}
                {summary.adjusted && <p className="text-xs text-slate-600">{summary.adjusted}</p>}
                {summary.kept && <p className="text-xs text-slate-600">{summary.kept}</p>}
                {summary.unmapped && <p className="text-xs text-slate-600">{summary.unmapped}</p>}
              </>
            )}
            <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">{goLiveNote(copy.goLiveMode, copy.goLiveOn)}</p>
          </aside>
        </div>
      )}

      {model && (
        <ModalFooter>
          {/* One wrapping row so the name and date drop above the buttons on a phone. */}
          <div className="flex w-full flex-wrap items-center justify-end gap-x-5 gap-y-3">
            <div className="mr-auto flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <label className="flex min-w-0 items-center gap-2">
                <span className="text-slate-600">Name</span>
                <input
                  value={copy.name}
                  onChange={(e) => copy.setName(e.target.value)}
                  className={`w-80 min-w-0 max-w-full ${smallField}`}
                />
              </label>
              <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <legend className="sr-only">When it goes live</legend>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="go-live"
                    checked={copy.goLiveMode === 'date'}
                    onChange={() => copy.setGoLiveMode('date')}
                  />
                  <span className="text-slate-600">Goes live on</span>
                  <input
                    type="date"
                    aria-label="Go-live date"
                    min={torontoToday()}
                    value={copy.goLiveOn}
                    onFocus={() => copy.setGoLiveMode('date')}
                    onChange={(e) => copy.setGoLiveOn(e.target.value)}
                    className={smallField}
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="go-live"
                    checked={copy.goLiveMode === 'manual'}
                    onChange={() => copy.setGoLiveMode('manual')}
                  />
                  <span className="text-slate-600">I&apos;ll publish it myself</span>
                </label>
              </fieldset>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!copy.canCreate} loading={copy.saving}>
                Create copy
              </Button>
            </div>
          </div>
        </ModalFooter>
      )}
    </Modal>
  )
}

export default CopyWithTimesModal
