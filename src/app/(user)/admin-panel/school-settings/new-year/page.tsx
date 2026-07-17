'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getRolloverPreview, createSchoolYear, executeRollover, getSchoolYears } from '@/services/schoolYearService'
import type { RolloverPreview, RolloverSummary } from '@/services/types/schoolYear'
import { CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const STEPS = ['Year', 'Students', 'Classes', 'Terms & extras', 'Review'] as const

const inputCls = 'border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50'

export default function NewYearWizard() {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const setYears = useSchoolYearStore((s) => s.setYears)

  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState<RolloverPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<RolloverSummary | null>(null)
  const [createdYearId, setCreatedYearId] = useState<string | null>(null)
  const [rolloverError, setRolloverError] = useState<string | null>(null)

  // Step 1 — year basics
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  // Step 2 — students
  const [studentsMode, setStudentsMode] = useState<'rollover' | 'skip'>('rollover')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [gradeOverrides, setGradeOverrides] = useState<Record<string, string>>({})
  const [studentSearch, setStudentSearch] = useState('')
  // Step 3 — classes
  const [classesMode, setClassesMode] = useState<'duplicate' | 'skip'>('duplicate')
  const [excludedClasses, setExcludedClasses] = useState<Set<string>>(new Set())
  // Step 4 — terms & extras
  const [terms, setTerms] = useState<{ name: string; startDate: string; endDate: string }[]>([])
  const [copyPlanner, setCopyPlanner] = useState(true)
  const [copyCalendar, setCopyCalendar] = useState(false)

  useEffect(() => {
    getRolloverPreview()
      .then((res) => {
        if (res.status === 'success') {
          setPreview(res.data)
          setTerms(res.data.terms.map((t) => ({
            name: t.name, startDate: t.proposedStartDate, endDate: t.proposedEndDate,
          })))
          // propose next year's label from the source label, e.g. 2025-2026 -> 2026-2027
          const m = res.data.sourceYear.label.match(/^(\d{4})-(\d{4})$/)
          if (m) setLabel(`${Number(m[1]) + 1}-${Number(m[2]) + 1}`)
        } else {
          setLoadError('Failed to load rollover preview')
        }
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load rollover preview'))
      .finally(() => setLoading(false))
  }, [])

  const visibleStudents = useMemo(() => {
    if (!preview) return []
    const q = studentSearch.trim().toLowerCase()
    return q ? preview.students.filter((s) => s.name.toLowerCase().includes(q)) : preview.students
  }, [preview, studentSearch])

  const includedStudents = useMemo(() => {
    if (!preview || studentsMode === 'skip') return []
    return preview.students.filter((s) =>
      !excluded.has(s.studentId) && (gradeOverrides[s.studentId] || !s.isGraduating))
  }, [preview, studentsMode, excluded, gradeOverrides])

  const includedClasses = useMemo(() => {
    if (!preview || classesMode === 'skip') return []
    return preview.classes.filter((c) => !excludedClasses.has(c.classId))
  }, [preview, classesMode, excludedClasses])

  const stepValid = () => {
    if (step === 0) return /^\d{4}-\d{4}$/.test(label) && !!startDate && !!endDate
    return true
  }

  const submit = async () => {
    setSubmitting(true)
    setRolloverError(null)
    try {
      let yearId = createdYearId
      if (!yearId) {
        try {
          const created = await createSchoolYear({ label, startDate, endDate })
          yearId = created.data.schoolYearId
          setCreatedYearId(yearId)
        } catch (err) {
          showNotification(err instanceof Error ? err.message : 'Failed to create the new year — nothing was created', 'error')
          return
        }
      }

      try {
        const res = await executeRollover(yearId, {
          students: { mode: studentsMode, excludeStudentIds: [...excluded], gradeOverrides },
          classes: { mode: classesMode, excludeClassIds: [...excludedClasses] },
          terms,
          copyPlanner,
          copyCalendar,
        })
        setResult(res.data)
        setCreatedYearId(null)
        const refreshed = await getSchoolYears()
        if (refreshed.status === 'success') setYears(refreshed.data)
        showNotification(`${label} created`, 'success')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setRolloverError(
          `"${label}" was created as a draft year, but copying data failed: ${message}. Fix the issue and press Create again to retry into the same year, or delete the draft in School Settings.`
        )
        showNotification('Copying data into the new year failed — see the message below to retry', 'error')
      }
    } finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="lg:ml-72 pt-28 px-4 lg:px-8 text-slate-500">Loading rollover preview…</div>
      </>
    )
  }

  if (loadError || !preview) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="lg:ml-72 pt-28 px-4 lg:px-8 max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Couldn’t load the rollover preview</h1>
            <p className="text-sm text-slate-600 mb-6">{loadError ?? 'Something went wrong loading the current year’s data.'}</p>
            <button onClick={() => router.push('/admin-panel/school-settings')}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500">
              Back to School Settings
            </button>
          </div>
        </div>
      </>
    )
  }

  if (result) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="lg:ml-72 pt-28 px-4 lg:px-8 max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">{label} is ready</h1>
            <p className="text-sm text-slate-600 mb-6">
              {result.termsCreated} terms · {result.studentsRolled} students rolled over
              ({result.studentsGraduated} graduating) · {result.classesCreated} classes
              {result.plannerCopied ? ' · planner copied' : ''}
              {result.calendarEventsCopied ? ` · ${result.calendarEventsCopied} calendar events` : ''}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              The current year is still active. When you’re ready, use “Set as active year” in School Settings.
            </p>
            <button onClick={() => router.push('/admin-panel/school-settings')}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500">
              Back to School Settings
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="lg:ml-72 pt-28 px-4 lg:px-8 max-w-4xl pb-16">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">New School Year</h1>
        <p className="text-sm text-slate-500 mb-6">Rolling over from {preview.sourceYear.label}</p>

        {/* Stepper */}
        <ol className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 text-xs font-medium ${i === step ? 'text-cyan-600' : i < step ? 'text-emerald-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${i === step ? 'border-cyan-500 bg-cyan-50' : i < step ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>{i + 1}</span>
              {s}{i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200" />}
            </li>
          ))}
        </ol>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          {step === 0 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Year label</label>
                  <input disabled={!!createdYearId} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2026-2027" className={`${inputCls} w-full disabled:opacity-60 disabled:cursor-not-allowed`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First day</label>
                  <input disabled={!!createdYearId} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inputCls} w-full disabled:opacity-60 disabled:cursor-not-allowed`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last day</label>
                  <input disabled={!!createdYearId} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${inputCls} w-full disabled:opacity-60 disabled:cursor-not-allowed`} />
                </div>
              </div>
              {createdYearId && (
                <p className="text-xs text-amber-600 mt-1">This year was already created as a draft — to change its name or dates, delete the draft in School Settings and start over.</p>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={studentsMode === 'rollover'} onChange={() => setStudentsMode('rollover')} />
                  Roll over students with grade advancement
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={studentsMode === 'skip'} onChange={() => setStudentsMode('skip')} />
                  Start with no students
                </label>
              </div>
              {studentsMode === 'rollover' && (
                <>
                  <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                         placeholder="Search students…" className={`${inputCls} w-full mb-3`} />
                  <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                        <tr><th className="px-3 py-2">Include</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Next year</th></tr>
                      </thead>
                      <tbody>
                        {visibleStudents.map((s) => {
                          const included = !excluded.has(s.studentId) && (gradeOverrides[s.studentId] || !s.isGraduating)
                          return (
                            <tr key={s.studentId} className="border-t border-slate-100">
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={!!included} disabled={s.isGraduating && !gradeOverrides[s.studentId]}
                                  onChange={(e) => setExcluded((prev) => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.delete(s.studentId); else next.add(s.studentId)
                                    return next
                                  })} />
                              </td>
                              <td className="px-3 py-2 text-slate-900">{s.name}</td>
                              <td className="px-3 py-2 text-slate-500">{s.grade}</td>
                              <td className="px-3 py-2">
                                {s.isGraduating && !gradeOverrides[s.studentId] ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Graduating</span>
                                ) : null}
                                <select value={gradeOverrides[s.studentId] ?? s.proposedGrade ?? ''}
                                  onChange={(e) => setGradeOverrides((prev) => {
                                    const value = e.target.value
                                    const next = { ...prev }
                                    if (value) next[s.studentId] = value; else delete next[s.studentId]
                                    return next
                                  })}
                                  className="ml-2 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white">
                                  {s.isGraduating && <option value="">—</option>}
                                  {['JK', 'SK', '1', '2', '3', '4', '5', '6', '7', '8'].map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{includedStudents.length} of {preview.students.length} students will be rolled over.</p>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={classesMode === 'duplicate'} onChange={() => setClassesMode('duplicate')} />
                  Duplicate this year’s classes (empty rosters, no assessments)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={classesMode === 'skip'} onChange={() => setClassesMode('skip')} />
                  Start with no classes
                </label>
              </div>
              {classesMode === 'duplicate' && (
                <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                      <tr><th className="px-3 py-2">Include</th><th className="px-3 py-2">Grade</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Teacher</th><th className="px-3 py-2">Term</th></tr>
                    </thead>
                    <tbody>
                      {preview.classes.map((c) => (
                        <tr key={c.classId} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={!excludedClasses.has(c.classId)}
                              onChange={(e) => setExcludedClasses((prev) => {
                                const next = new Set(prev)
                                if (e.target.checked) next.delete(c.classId); else next.add(c.classId)
                                return next
                              })} />
                          </td>
                          <td className="px-3 py-2">{c.grade}</td>
                          <td className="px-3 py-2 text-slate-900">{c.subject}</td>
                          <td className="px-3 py-2 text-slate-500">{c.teacherName ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{c.termName ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Terms for the new year</h3>
              {terms.map((t, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2">
                  <input value={t.name} onChange={(e) => setTerms((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={inputCls} />
                  <input type="date" value={t.startDate} onChange={(e) => setTerms((p) => p.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x))} className={inputCls} />
                  <input type="date" value={t.endDate} onChange={(e) => setTerms((p) => p.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x))} className={inputCls} />
                  <button onClick={() => setTerms((p) => p.filter((_, j) => j !== i))}
                          className="px-3 py-2 rounded-xl text-xs border border-red-200 text-red-600 hover:bg-red-50">Remove</button>
                </div>
              ))}
              <button onClick={() => setTerms((p) => [...p, { name: `Term ${p.length + 1}`, startDate: '', endDate: '' }])}
                      className="mt-1 px-3 py-2 rounded-xl text-xs border border-slate-200 text-slate-600 hover:bg-slate-50">+ Add term</button>

              <h3 className="text-sm font-medium text-slate-900 mt-6 mb-2">Also copy</h3>
              <label className="flex items-center gap-2 text-sm mb-1">
                <input type="checkbox" checked={copyPlanner} onChange={(e) => setCopyPlanner(e.target.checked)} />
                Schedule-planner setup (rooms, class groups, day templates, fixed blocks)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={copyCalendar} onChange={(e) => setCopyCalendar(e.target.checked)} />
                Calendar events (dates shifted one year — review afterwards)
              </label>
            </div>
          )}

          {step === 4 && (
            <ul className="text-sm text-slate-700 space-y-2">
              <li><strong>{label}</strong> · {startDate} → {endDate}</li>
              <li>{studentsMode === 'rollover' ? `${includedStudents.length} students rolled over (${preview.students.filter(s => s.isGraduating && !gradeOverrides[s.studentId]).length} graduating, ${excluded.size} excluded)` : 'No students'}</li>
              <li>{classesMode === 'duplicate' ? `${includedClasses.length} classes duplicated (empty rosters)` : 'No classes'}</li>
              <li>{terms.length} terms</li>
              <li>Planner setup: {copyPlanner ? 'copied' : 'not copied'} · Calendar: {copyCalendar ? 'copied (+1 year)' : 'not copied'}</li>
              <li className="text-slate-500">The current year stays active — activation is a separate step in School Settings.</li>
            </ul>
          )}
        </div>

        {rolloverError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <span>{rolloverError}</span>
          </div>
        )}

        <div className="flex justify-between">
          <button disabled={step === 0} onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 disabled:opacity-40">
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button disabled={!stepValid()} onClick={() => setStep((s) => s + 1)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 disabled:opacity-40">
              Next <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button disabled={submitting} onClick={submit}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 disabled:opacity-50">
              {submitting ? 'Creating year…' : createdYearId ? `Retry ${label}` : `Create ${label}`}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
