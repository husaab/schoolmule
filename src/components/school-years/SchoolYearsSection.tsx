'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import {
  getSchoolYears, createSchoolYear, updateSchoolYear,
  activateSchoolYear, deleteSchoolYear,
} from '@/services/schoolYearService'
import type { SchoolYear } from '@/services/types/schoolYear'
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'

type FormState = { label: string; startDate: string; endDate: string }
const emptyForm: FormState = { label: '', startDate: '', endDate: '' }

export default function SchoolYearsSection() {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const setYears = useSchoolYearStore((s) => s.setYears)
  const [years, setLocalYears] = useState<SchoolYear[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getSchoolYears()
      if (res.status === 'success') {
        setLocalYears(res.data)
        setYears(res.data) // keep the global selector in sync
      }
    } catch {
      showNotification('Failed to load school years', 'error')
    }
  }, [setYears, showNotification])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!/^\d{4}-\d{4}$/.test(form.label)) {
      showNotification('Label must look like 2026-2027', 'error'); return
    }
    if (!form.startDate || !form.endDate) {
      showNotification('Start and end dates are required', 'error'); return
    }
    setBusy(true)
    try {
      const res = editingId
        ? await updateSchoolYear(editingId, form)
        : await createSchoolYear(form)
      if (res.status === 'success') {
        showNotification(editingId ? 'School year updated' : 'School year created', 'success')
        setForm(emptyForm); setEditingId(null); setShowForm(false)
        await load()
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to save school year', 'error')
    } finally { setBusy(false) }
  }

  const activate = async (y: SchoolYear) => {
    const ok = window.confirm(
      `Set ${y.label} as the active school year?\n\nEveryone at your school will see ${y.label} data by default after this.`)
    if (!ok) return
    try {
      const res = await activateSchoolYear(y.schoolYearId)
      if (res.status === 'success') {
        showNotification(`${y.label} is now the active school year`, 'success')
        await load()
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to activate year', 'error')
    }
  }

  const remove = async (y: SchoolYear) => {
    if (!window.confirm(`Delete school year ${y.label}? This only works if it has no data.`)) return
    try {
      await deleteSchoolYear(y.schoolYearId)
      showNotification('School year deleted', 'success')
      await load()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to delete year', 'error')
    }
  }

  const chip = (y: SchoolYear) => {
    if (y.isActive) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
    const now = new Date().toISOString().slice(0, 10)
    if (y.startDate > now) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">Draft</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Past</span>
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">School Years</h2>
          <p className="text-sm text-slate-500">Each year has its own students, classes and terms.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin-panel/school-settings/new-year"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-90">
            <SparklesIcon className="h-4 w-4" /> New school year
          </Link>
          <button onClick={() => { setShowForm((v) => !v); setEditingId(null); setForm(emptyForm) }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50">
            <PlusIcon className="h-4 w-4" /> Add empty year
          </button>
        </div>
      </div>

      {showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                 placeholder="2026-2027"
                 className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500" />
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                 className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500" />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                 className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500" />
          <button onClick={submit} disabled={busy}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 disabled:opacity-50">
            {editingId ? 'Save changes' : 'Create year'}
          </button>
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {years.map((y) => (
          <li key={y.schoolYearId} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-900">{y.label}</span>
              {chip(y)}
              <span className="text-xs text-slate-500">{y.startDate?.slice(0, 10)} → {y.endDate?.slice(0, 10)}</span>
            </div>
            <div className="flex items-center gap-2">
              {!y.isActive && (
                <button onClick={() => activate(y)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  Set as active year
                </button>
              )}
              <button onClick={() => { setEditingId(y.schoolYearId); setShowForm(true)
                        setForm({ label: y.label, startDate: y.startDate?.slice(0, 10) ?? '', endDate: y.endDate?.slice(0, 10) ?? '' }) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                Edit
              </button>
              {!y.isActive && (
                <button onClick={() => remove(y)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
