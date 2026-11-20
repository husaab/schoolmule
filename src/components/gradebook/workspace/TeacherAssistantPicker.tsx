// src/components/gradebook/workspace/TeacherAssistantPicker.tsx
// The teacher assistant on a JK/SK student's progress report and report card:
// a co-teacher of the Kindergarten class (Class → Settings → Teachers). The
// class's only co-teacher is the default; a teacher can pick another, or
// nobody, for this student and term. Picking saves at once (not part of the
// document's autosave). See lib/teacherAssistant.ts.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'
import { getJKTeacherAssistant, saveJKTeacherAssistant } from '@/services/jkService'
import { getSKTeacherAssistant, saveSKTeacherAssistant } from '@/services/skService'
import type { TeacherAssistantInfo } from '@/services/types/kindergartenStaff'
import { assistantNote, assistantOptions, assistantPayload, assistantValue, canChooseAssistant } from '@/lib/teacherAssistant'
import { classHref } from '@/lib/classroomRoutes'
import { useNotificationStore } from '@/store/useNotificationStore'

const SERVICES = {
  jk: { get: getJKTeacherAssistant, save: saveJKTeacherAssistant },
  sk: { get: getSKTeacherAssistant, save: saveSKTeacherAssistant },
} as const

interface TeacherAssistantPickerProps {
  kind: 'jk' | 'sk'
  studentId: string
  term: string
}

export default function TeacherAssistantPicker({ kind, studentId, term }: TeacherAssistantPickerProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [info, setInfo] = useState<TeacherAssistantInfo | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const seq = useRef(0)

  const load = useCallback(async () => {
    const mine = ++seq.current
    setState('loading')
    // A save for the previous student or term may still be in flight: it is
    // ignored when it lands, so it must not keep this one disabled.
    setSaving(false)
    setSaved(false)
    try {
      const res = await SERVICES[kind].get(studentId, term)
      if (mine !== seq.current) return
      if (res.status !== 'success') throw new Error(res.message || 'Could not load the teacher assistant')
      setInfo(res.data)
      setState('ready')
    } catch {
      if (mine === seq.current) setState('error')
    }
  }, [kind, studentId, term])

  useEffect(() => {
    if (studentId && term) void load()
  }, [load, studentId, term])

  const choose = async (value: string) => {
    const payload = assistantPayload(value, { studentId, term })
    if (!payload || !info) return
    const mine = seq.current
    setSaving(true)
    setSaved(false)
    try {
      const res = await SERVICES[kind].save(payload)
      if (mine !== seq.current) return
      if (res.status !== 'success') throw new Error(res.message)
      setInfo(res.data)
      setSaved(true)
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : 'Could not save the teacher assistant', 'error')
    } finally {
      if (mine === seq.current) setSaving(false)
    }
  }

  const selectId = `${kind}-teacher-assistant`
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
        Teacher assistant
      </label>
      {state === 'loading' && <div className="h-9 w-full max-w-sm rounded-lg bg-slate-100 animate-pulse" aria-label="Loading the teacher assistant" />}
      {state === 'error' && (
        <p className="text-sm text-rose-600">
          Could not load the teacher assistant.{' '}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Try again
          </button>
        </p>
      )}
      {state === 'ready' && info && (
        <>
          {canChooseAssistant(info) ? (
            <div className="flex items-center gap-2">
              <select
                id={selectId}
                value={assistantValue(info)}
                onChange={(e) => void choose(e.target.value)}
                disabled={saving}
                className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60"
              >
                {assistantValue(info) === '' && (
                  <option value="" disabled>
                    Choose the teacher assistant
                  </option>
                )}
                {assistantOptions(info).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {saving && <span className="text-xs text-slate-500">Saving…</span>}
              {saved && !saving && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden /> Saved
                </span>
              )}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {assistantNote(info)}{' '}
            {!canChooseAssistant(info) && info.classId && (
              info.canManageClass ? (
                <Link href={classHref(info.classId, 'settings')} className="font-semibold text-emerald-700 hover:underline">
                  Add one in Class settings → Teachers
                </Link>
              ) : (
                <span>Ask the class teacher or the office to add one in Class settings → Teachers.</span>
              )
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">Printed on both the progress report and the report card, with each person&apos;s saved signature.</p>
        </>
      )}
    </div>
  )
}
