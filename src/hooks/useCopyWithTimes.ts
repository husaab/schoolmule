// State for "Copy with new times": the bell rows being edited, new breaks,
// school hours, the pasted list, the debounced server check and the save.
// The web modal and the app's sheet render it; neither owns the logic.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createRetimedSchedule,
  getRetimeModel,
  previewRetime,
} from '@/services/schedulePlannerService'
import type {
  RetimeEdits,
  RetimeModel,
  RetimePreview,
  RetimeRow,
  ScheduleDraft,
  TimeRange,
} from '@/services/types/schedulePlanner'
import { isTimeChanged, matchPastedBells, mergeAddedBreaks, parseBellText } from '@/lib/bellTimes'

export interface AddedBreak {
  key: string
  bellId: string
  label: string
  startMin: number
  endMin: number
}

export type RetimeRowView =
  | { kind: 'row'; key: string; row: RetimeRow; now: TimeRange; next: TimeRange; removed: boolean }
  | { kind: 'added'; key: string; added: AddedBreak; next: TimeRange }

const validRange = (r: TimeRange) => Number.isInteger(r.startMin) && Number.isInteger(r.endMin) && r.endMin > r.startMin
const byNewTime = (a: RetimeRowView, b: RetimeRowView) => a.next.startMin - b.next.startMin || a.next.endMin - b.next.endMin

export function useCopyWithTimes(scheduleId: string | null) {
  const [model, setModel] = useState<RetimeModel | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [bellIndex, setBellIndex] = useState(0)
  const [times, setTimes] = useState<Record<string, TimeRange>>({})
  const [removed, setRemoved] = useState<Record<string, boolean>>({})
  const [added, setAdded] = useState<AddedBreak[]>([])
  const [hours, setHours] = useState<Record<string, TimeRange>>({})
  const [name, setName] = useState('')
  const [goLiveMode, setGoLiveMode] = useState<'date' | 'manual'>('date')
  const [goLiveOn, setGoLiveOn] = useState('')
  const [preview, setPreview] = useState<RetimePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recheckTick, setRecheckTick] = useState(0)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteNote, setPasteNote] = useState<string | null>(null)
  // Rows sit in new-time order, but only re-sort on a paste, a new break, a
  // tab change or leaving a time field, so a row never jumps while it's typed in.
  const [order, setOrder] = useState<string[]>([])
  const [resortTick, setResortTick] = useState(0)
  const resort = useCallback(() => setResortTick((t) => t + 1), [])
  const addedSeq = useRef(0)
  const previewSeq = useRef(0)

  useEffect(() => {
    if (!scheduleId) return
    setModel(null)
    setLoadError(null)
    setBellIndex(0)
    setTimes({})
    setRemoved({})
    setAdded([])
    setHours({})
    setPreview(null)
    setPreviewError(null)
    setGoLiveMode('date')
    setGoLiveOn('')
    setPasteOpen(false)
    setPasteText('')
    setPasteNote(null)
    let cancelled = false
    getRetimeModel(scheduleId)
      .then((res) => {
        if (cancelled) return
        if (res.status !== 'success') throw new Error('Could not load the bell times')
        setModel(res.data)
        setName(`${res.data.schedule.name.replace(/ \(new times\)$/, '')} (new times)`)
      })
      .catch((err) => !cancelled && setLoadError(err instanceof Error ? err.message : 'Could not load the bell times'))
    return () => {
      cancelled = true
    }
  }, [scheduleId])

  const bells = useMemo(() => model?.bells ?? [], [model])
  const bell = bells[bellIndex]

  const invalid = useMemo(
    () =>
      Object.entries(times).some(([id, t]) => !removed[id] && !validRange(t)) ||
      Object.values(hours).some((t) => !validRange(t)) ||
      added.some((a) => !a.label.trim() || !validRange(a)),
    [times, removed, hours, added]
  )

  const edits: RetimeEdits = useMemo(
    () => ({
      rows: [
        ...Object.entries(times)
          .filter(([id]) => !removed[id])
          .map(([rowId, t]) => ({ rowId, startMin: t.startMin, endMin: t.endMin })),
        ...Object.keys(removed)
          .filter((id) => removed[id])
          .map((rowId) => ({ rowId, removed: true })),
      ],
      added: mergeAddedBreaks(
        added.map((a) => ({
          label: a.label,
          startMin: a.startMin,
          endMin: a.endMin,
          classGroupIds: bells.find((b) => b.bellId === a.bellId)?.classGroupIds ?? [],
        })),
        bells
      ),
      hours: Object.entries(hours).map(([rowId, t]) => ({ rowId, startMin: t.startMin, endMin: t.endMin })),
    }),
    [times, removed, added, hours, bells]
  )

  // Re-check on every change, debounced; a slow answer to an older edit is dropped.
  useEffect(() => {
    if (!scheduleId || !model || invalid) return
    const seq = ++previewSeq.current
    setChecking(true)
    const timer = setTimeout(() => {
      previewRetime(scheduleId, { edits })
        .then((res) => {
          if (seq !== previewSeq.current) return
          if (res.status !== 'success') throw new Error('Could not check the new times')
          setPreview(res.data)
          setPreviewError(null)
        })
        .catch((err) => {
          if (seq !== previewSeq.current) return
          setPreviewError(err instanceof Error ? err.message : 'Could not check the new times')
        })
        .finally(() => {
          if (seq === previewSeq.current) setChecking(false)
        })
    }, 350)
    return () => clearTimeout(timer)
  }, [scheduleId, model, edits, invalid, recheckTick])

  /** Ask the server again after a failed check. */
  const recheck = () => setRecheckTick((t) => t + 1)

  const unsortedRows: RetimeRowView[] = useMemo(() => {
    if (!bell) return []
    const rows: RetimeRowView[] = bell.rows.map((r) => {
      const now = { startMin: r.startMin, endMin: r.endMin }
      return { kind: 'row', key: r.rowId, row: r, now, next: times[r.rowId] ?? now, removed: !!removed[r.rowId] }
    })
    const extra: RetimeRowView[] = added
      .filter((a) => a.bellId === bell.bellId)
      .map((a) => ({ kind: 'added', key: a.key, added: a, next: { startMin: a.startMin, endMin: a.endMin } }))
    return [...rows, ...extra]
  }, [bell, times, removed, added])
  const latestRows = useRef(unsortedRows)
  latestRows.current = unsortedRows

  useEffect(() => {
    setOrder([...latestRows.current].sort(byNewTime).map((r) => r.key))
  }, [resortTick, bell])

  /** The active bell's rows plus its new breaks, in new-time order as of the last re-sort. */
  const rowsView: RetimeRowView[] = useMemo(() => {
    const at = new Map(order.map((key, i) => [key, i]))
    return [...unsortedRows].sort((a, b) => (at.get(a.key) ?? Infinity) - (at.get(b.key) ?? Infinity) || byNewTime(a, b))
  }, [unsortedRows, order])

  const hoursView = useMemo(
    () =>
      (model?.hours ?? []).map((h) => {
        const now = { startMin: h.startMin, endMin: h.endMin }
        return { hours: h, now, next: hours[h.rowId] ?? now }
      }),
    [model, hours]
  )

  const setRowTime = (rowId: string, next: TimeRange) => setTimes((prev) => ({ ...prev, [rowId]: next }))
  const setRowRemoved = (rowId: string, value: boolean) => setRemoved((prev) => ({ ...prev, [rowId]: value }))
  const setHoursTime = (rowId: string, next: TimeRange) => setHours((prev) => ({ ...prev, [rowId]: next }))

  const addBreak = () => {
    if (!bell) return
    const last = rowsView[rowsView.length - 1]?.next.endMin ?? 720
    setAdded((prev) => [
      ...prev,
      { key: `new-${++addedSeq.current}`, bellId: bell.bellId, label: '', startMin: last, endMin: last + 10 },
    ])
    resort()
  }
  const updateAdded = (key: string, patch: Partial<Omit<AddedBreak, 'key' | 'bellId'>>) =>
    setAdded((prev) => prev.map((a) => (a.key === key ? { ...a, ...patch } : a)))
  const removeAdded = (key: string) => setAdded((prev) => prev.filter((a) => a.key !== key))

  /** Fills the active bell from the pasted list and says what happened. */
  const fillFromPaste = () => {
    if (!bell || !model) return
    const lines = parseBellText(pasteText)
    if (lines.length === 0) {
      setPasteNote('No times found. Paste one bell per line, like "8:40–8:50 Assembly".')
      return
    }
    const match = matchPastedBells(lines, bell)
    setTimes((prev) => ({
      ...prev,
      ...Object.fromEntries(match.rows.map((r) => [r.rowId, { startMin: r.startMin, endMin: r.endMin }])),
    }))
    setRemoved((prev) => ({ ...prev, ...Object.fromEntries(match.rows.map((r) => [r.rowId, false])) }))
    setAdded((prev) => {
      const mine = prev.filter((a) => a.bellId === bell.bellId)
      const fresh = match.added
        .filter((p) => !mine.some((a) => a.label === p.label && a.startMin === p.startMin && a.endMin === p.endMin))
        .map((p) => ({ key: `new-${++addedSeq.current}`, bellId: bell.bellId, ...p }))
      return [...prev, ...fresh]
    })
    // Stretch the school day to fit the pasted bells (8:40 Assembly before an 8:55 start).
    if (model.hours.length === 1) {
      const h = model.hours[0]
      const current = hours[h.rowId] ?? { startMin: h.startMin, endMin: h.endMin }
      const stretched = {
        startMin: Math.min(current.startMin, ...lines.map((l) => l.startMin)),
        endMin: Math.max(current.endMin, ...lines.map((l) => l.endMin)),
      }
      if (isTimeChanged(stretched, current)) setHoursTime(h.rowId, stretched)
    }
    const parts = [`Filled ${match.rows.length} of ${bell.rows.length} bells for ${bell.label}`]
    if (match.added.length) parts.push(`added ${match.added.map((a) => a.label).join(' and ')}`)
    if (match.untouched.length) parts.push(`${match.untouched.map((r) => r.label).join(', ')} kept their times`)
    setPasteNote(`${parts.join('; ')}.${bells.length > 1 ? ' Paste the next list on the other tab.' : ''}`)
    setPasteText('')
    resort()
  }

  const goLiveMissing = goLiveMode === 'date' && !goLiveOn
  // Only once the check on screen matches the times entered.
  const canCreate =
    !!model && !invalid && !!preview && !checking && !previewError && !goLiveMissing && !!name.trim() && !saving

  /** Saves the copy; resolves to the new draft, rejects with the server's message. */
  const create = async (): Promise<ScheduleDraft> => {
    if (!scheduleId || !canCreate) throw new Error('Finish the times first')
    setSaving(true)
    try {
      const res = await createRetimedSchedule(scheduleId, {
        edits,
        name: name.trim(),
        goLiveOn: goLiveMode === 'date' ? goLiveOn : null,
      })
      if (res.status !== 'success') throw new Error('Could not save the copy')
      return res.data.schedule
    } finally {
      setSaving(false)
    }
  }

  return {
    model,
    loadError,
    bells,
    bell,
    bellIndex,
    setBellIndex,
    rowsView,
    resort,
    hoursView,
    setRowTime,
    setRowRemoved,
    setHoursTime,
    addBreak,
    updateAdded,
    removeAdded,
    fillFromPaste,
    pasteOpen,
    setPasteOpen,
    pasteText,
    setPasteText,
    pasteNote,
    name,
    setName,
    goLiveMode,
    setGoLiveMode,
    goLiveOn,
    setGoLiveOn,
    preview,
    previewError,
    recheck,
    checking,
    invalid,
    canCreate,
    saving,
    create,
  }
}
