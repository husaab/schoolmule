'use client'

// Student summary: one student in one class as a PDF (every assessment, the
// term grade, attendance), for a parent–teacher conference. Choose on the
// left (term, then class, then the student from that class's grade, then the
// page layout); the PDF previews on the right with Download, Full screen and
// Next student. Choices live in the URL (term, class, student, orientation).

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import BackLink from '@/components/shared/BackLink'
import Avatar from '@/components/avatar/Avatar'
import SearchableSelect from '@/components/ui/SearchableSelect'
import PdfViewerModal from '@/components/reports/PdfViewerModal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { can } from '@/lib/permissions'
import { getClassesByTeacherId, getAllClasses } from '@/services/classService'
import { getAllStudents } from '@/services/studentService'
import { getTermsBySchool } from '@/services/termService'
import { generateStudentSummaryReport } from '@/services/reportService'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { TermPayload } from '@/services/types/term'
import { useFilterParams } from '@/hooks/useFilterParams'
import { currentTermClasses, classPickerOptions } from '@/lib/classListFilters'
import { saveBlob } from '@/lib/pdfDownload'

type Orientation = 'horizontal' | 'vertical'

const pdfKey = (studentId: string, classId: string, orientation: Orientation) => `${studentId}|${classId}|${orientation}`

const toolButton =
  'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const fieldLabel = 'mb-1.5 block text-sm font-medium text-slate-700'
const pickerTrigger = 'rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:ring-cyan-500'

const StudentSummaryContent = () => {
  const user = useUserStore((state) => state.user)
  const schoolWide = can(user, 'report_cards')
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((state) => state.showNotification)
  const { get, setParams } = useFilterParams()

  const [students, setStudents] = useState<StudentPayload[]>([])
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [activeTerm, setActiveTerm] = useState<TermPayload | null>(null)

  // Choices live in the URL so Back/refresh/share restore them.
  const selectedStudent = get('student')
  const selectedClass = get('class')
  const selectedTerm = get('term', 'active')
  const orientation: Orientation = get('orientation') === 'vertical' ? 'vertical' : 'horizontal'
  const [loading, setLoading] = useState(true)
  const [studentQuery, setStudentQuery] = useState('')
  // The last PDF built, tagged with what it was built for; it shows only while those choices stand.
  // Its object URL is made here and revoked when the next one replaces it or the page closes.
  const [pdf, setPdf] = useState<{ key: string; blob: Blob; url: string } | null>(null)
  const pdfRef = useRef<{ url: string } | null>(null)
  const latestRequest = useRef<string | null>(null)
  useEffect(() => () => {
    if (pdfRef.current) URL.revokeObjectURL(pdfRef.current.url)
  }, [])
  const [generatingKey, setGeneratingKey] = useState<string | null>(null)
  const [fullScreen, setFullScreen] = useState(false)

  const loadClasses = useCallback(async () => {
    if (!user?.school || !user?.id) return
    try {
      // Report cards and reports are school-wide for report_cards holders
      // (teachers included, D6); anyone else picks from their own classes.
      const response = schoolWide ? await getAllClasses(user.school) : await getClassesByTeacherId(user.id)
      if (response.status === 'success') setClasses(response.data)
    } catch (error) {
      console.error('Error loading classes:', error)
      showNotification('Error loading classes', 'error')
    }
  }, [user?.school, user?.id, schoolWide, showNotification, selectedYearId]) // refetch when the selected school year changes

  const loadStudents = useCallback(async () => {
    if (!user?.school) return
    try {
      const studentsResponse = await getAllStudents(user.school)
      if (studentsResponse.status === 'success') setStudents(studentsResponse.data)
    } catch (error) {
      console.error('Error loading students:', error)
      showNotification('Error loading students', 'error')
    }
  }, [user?.school, showNotification, selectedYearId]) // refetch when the selected school year changes

  const loadTerms = useCallback(async () => {
    if (!user?.school) return
    try {
      const response = await getTermsBySchool(user.school)
      if (response.status === 'success') {
        setTerms(response.data)
        const active = response.data.find((term) => term.isActive)
        if (active) setActiveTerm(active)
      }
    } catch (error) {
      console.error('Error loading terms:', error)
    }
  }, [user?.school, selectedYearId]) // refetch when the selected school year changes

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !user?.school) return
      setLoading(true)
      try {
        await Promise.all([loadClasses(), loadStudents(), loadTerms()])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.id, user?.school, user?.role, loadClasses, loadStudents, loadTerms])

  const selectedClassData = classes.find((c) => c.classId === selectedClass)
  // The class's grade is its roster here, as before; names A–Z.
  const classStudents = selectedClassData
    ? students.filter((student) => student.grade === selectedClassData.grade).sort((a, b) => a.name.localeCompare(b.name))
    : []
  const needle = studentQuery.trim().toLowerCase()
  const shownStudents = needle ? classStudents.filter((s) => s.name.toLowerCase().includes(needle)) : classStudents
  const selectedStudentData = students.find((s) => s.studentId === selectedStudent)

  // A class exists once per term, so offer only the chosen term's classes
  // (the active term by default); a deep-linked class from another term stays.
  const viewTermName = selectedTerm === 'active' ? activeTerm?.name : selectedTerm
  const classOptions = classPickerOptions(currentTermClasses(classes, viewTermName, selectedClass), viewTermName)
  const layoutName = orientation === 'horizontal' ? 'Landscape' : 'Portrait'

  const currentKey = selectedStudent && selectedClass ? pdfKey(selectedStudent, selectedClass, orientation) : null
  const shownBlob = pdf && pdf.key === currentKey ? pdf.blob : null
  const pdfUrl = pdf && pdf.key === currentKey ? pdf.url : null
  const phase: 'empty' | 'ready' | 'busy' | 'done' = !currentKey || !selectedStudentData
    ? 'empty'
    : generatingKey === currentKey
      ? 'busy'
      : shownBlob
        ? 'done'
        : 'ready'

  const generateFor = async (studentId: string) => {
    if (!studentId || !selectedClass) {
      showNotification('Please select both a student and a class', 'error')
      return
    }
    const key = pdfKey(studentId, selectedClass, orientation)
    latestRequest.current = key
    setGeneratingKey(key)
    try {
      const blob = await generateStudentSummaryReport(studentId, selectedClass, orientation)
      // A quicker Next press already asked for someone else: keep theirs.
      if (latestRequest.current !== key) return
      const next = { key, blob, url: URL.createObjectURL(blob) }
      if (pdfRef.current) URL.revokeObjectURL(pdfRef.current.url)
      pdfRef.current = next
      setPdf(next)
    } catch (error) {
      console.error('Error generating report:', error)
      showNotification(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setGeneratingKey((k) => (k === key ? null : k))
    }
  }

  // Previous / next student in the class list, wrapping around; builds theirs straight away.
  const stepStudent = (delta: 1 | -1) => {
    if (classStudents.length === 0) return
    const at = classStudents.findIndex((s) => s.studentId === selectedStudent)
    // A student not in this class's list (an old link) steps to the first or last.
    const next = at < 0 ? classStudents[delta === 1 ? 0 : classStudents.length - 1] : classStudents[(at + delta + classStudents.length) % classStudents.length]
    setParams({ student: next.studentId })
    void generateFor(next.studentId)
  }
  const nextStudent =
    classStudents.length > 1
      ? classStudents[(classStudents.findIndex((s) => s.studentId === selectedStudent) + 1) % classStudents.length]
      : null

  const handleDownloadPdf = () => {
    if (!shownBlob) return
    const filename = `${selectedStudentData?.name || 'Student'}_${selectedClassData?.subject || 'Report'}_${viewTermName || 'Term'}.pdf`
    saveBlob(shownBlob, filename)
  }

  const subtitle = `${selectedClassData?.subject ?? ''} · ${viewTermName ?? ''} · ${layoutName}`

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="min-w-0">
            <BackLink to="/reports" className="mb-2 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeftIcon className="h-4 w-4" />
              Reports
            </BackLink>
            <h1 className="font-display text-[26px] font-semibold leading-tight text-slate-900 sm:text-[30px]">Student summary</h1>
            <p className="mt-1 max-w-3xl text-[15px] text-slate-600">
              One student in one class: every assessment, their term grade and attendance, as a PDF for a conference.
            </p>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
            {/* Builder */}
            <section aria-label="Choose the report" className="space-y-5 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              {loading ? (
                <div className="space-y-4" aria-label="Loading">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                  <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
                </div>
              ) : (
                <>
                  <div>
                    <span className={fieldLabel}>Term</span>
                    <SearchableSelect
                      options={[
                        { value: 'active', label: `Active term (${activeTerm?.name ?? 'none'})` },
                        // The active term is already the first row.
                        ...terms.filter((term) => term.termId !== activeTerm?.termId).map((term) => ({ value: term.name, label: term.name })),
                      ]}
                      value={selectedTerm}
                      onChange={(v) => setParams({ term: v === 'active' ? null : v })}
                      ariaLabel="Term"
                      triggerClassName={pickerTrigger}
                    />
                  </div>

                  <div>
                    <span className={fieldLabel}>Class</span>
                    <SearchableSelect
                      options={classOptions}
                      value={selectedClass}
                      onChange={(v) => {
                        // A new class has a different list of students.
                        setStudentQuery('')
                        setParams({ class: v, student: null })
                      }}
                      placeholder="Choose a class"
                      ariaLabel="Class"
                      searchPlaceholder="Find a class"
                      triggerClassName={pickerTrigger}
                    />
                    <p className="mt-1 text-xs text-slate-500">Only {viewTermName ?? 'this term'}&apos;s classes are listed.</p>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">Student</span>
                      {selectedClassData && <span className="text-xs text-slate-500">{classStudents.length} in this class</span>}
                    </div>
                    {!selectedClassData ? (
                      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                        Pick a class to see its students.
                      </p>
                    ) : (
                      <>
                        {classStudents.length > 8 && (
                          <div className="relative mb-2">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="search"
                              value={studentQuery}
                              onChange={(e) => setStudentQuery(e.target.value)}
                              placeholder="Find a student"
                              aria-label="Find a student"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        )}
                        <div role="group" aria-label="Students" className="max-h-80 space-y-0.5 overflow-y-auto rounded-xl border border-slate-100 p-1">
                          {shownStudents.length === 0 ? (
                            <p className="px-3 py-4 text-center text-sm text-slate-500">
                              {classStudents.length === 0 ? 'No students in this grade yet.' : 'No one matches that name.'}
                            </p>
                          ) : (
                            shownStudents.map((student) => {
                              const on = student.studentId === selectedStudent
                              return (
                                <button
                                  key={student.studentId}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => setParams({ student: student.studentId })}
                                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                                    on ? 'bg-cyan-50 font-medium text-cyan-900' : 'text-slate-800 hover:bg-slate-50'
                                  }`}
                                >
                                  <Avatar student name={student.name} avatar={student.avatar ?? null} photoUrl={student.photoUrl ?? null} size={28} />
                                  <span className="min-w-0 flex-1 truncate">{student.name}</span>
                                  {on && <CheckIcon className="h-4 w-4 shrink-0 text-cyan-600" aria-hidden="true" />}
                                </button>
                              )
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <span className={fieldLabel}>Page layout</span>
                    <div role="group" aria-label="Page layout" className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: 'horizontal', label: 'Landscape', hint: 'Room for categories', shape: 'h-[22px] w-[30px]' },
                          { value: 'vertical', label: 'Portrait', hint: 'Fits a binder', shape: 'h-[30px] w-[22px] mx-1' },
                        ] as const
                      ).map((opt) => {
                        const on = orientation === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setParams({ orientation: opt.value === 'horizontal' ? null : opt.value })}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                              on ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className={`shrink-0 rounded-[3px] border-[1.5px] ${opt.shape} ${on ? 'border-cyan-600' : 'border-slate-400'}`} aria-hidden="true" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-900">{opt.label}</span>
                              <span className="block text-xs text-slate-500">{opt.hint}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Preview */}
            <section
              aria-label="Preview"
              className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-24 lg:h-[calc(100vh-7.5rem)]"
            >
              {phase === 'empty' && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
                  <div className="mb-2 h-24 w-32 rounded-md border-[1.5px] border-dashed border-slate-300 bg-slate-50" aria-hidden="true" />
                  <p className="text-[15px] font-medium text-slate-700">{selectedClassData ? 'Pick a student to see their report' : 'Pick a class and a student'}</p>
                  <p className="max-w-sm text-sm text-slate-500">The report builds here, ready to download or show full screen.</p>
                </div>
              )}

              {phase === 'ready' && selectedStudentData && (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-slate-50 p-6 sm:p-10">
                  <div
                    className={`flex flex-col gap-2.5 rounded bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.08)] ${
                      orientation === 'horizontal' ? 'aspect-[11/8.5] w-full max-w-md' : 'aspect-[8.5/11] w-full max-w-[300px]'
                    }`}
                  >
                    <span className="text-xs text-slate-500">Student summary</span>
                    <span className="font-display text-2xl font-semibold text-slate-900">{selectedStudentData.name}</span>
                    <span className="text-sm text-slate-600">
                      Grade {selectedStudentData.grade} · {selectedClassData?.subject} · {viewTermName}
                    </span>
                    <span className="my-1 h-px bg-slate-200" />
                    <span className="text-xs leading-relaxed text-slate-600">
                      Every assessment and category in this class, the term grade, and class attendance.
                    </span>
                  </div>
                  <button type="button" onClick={() => void generateFor(selectedStudent)} className={`${primaryButton} px-6 py-3 text-[15px]`}>
                    <DocumentPlusIcon className="h-5 w-5" />
                    Generate PDF
                  </button>
                </div>
              )}

              {phase === 'busy' && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50">
                  <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-cyan-100 border-t-cyan-600" aria-hidden="true" />
                  <p role="status" className="text-sm text-slate-600">Building {selectedStudentData?.name.split(' ')[0]}&apos;s report…</p>
                </div>
              )}

              {phase === 'done' && (
                <>
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{selectedStudentData?.name}</p>
                      <p className="truncate text-xs text-slate-500">{subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {classStudents.length > 1 && (
                        <>
                          <button type="button" onClick={() => stepStudent(-1)} aria-label="Previous student" className={`${toolButton} w-9 px-0`}>
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => stepStudent(1)} className={toolButton}>
                            Next: {nextStudent?.name.split(' ')[0]}
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
                        </>
                      )}
                      <button type="button" onClick={() => setFullScreen(true)} aria-label="Full screen" className={`${toolButton} w-9 px-0`}>
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={handleDownloadPdf} className={`${primaryButton} h-9 px-3.5`}>
                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-100">
                    {pdfUrl && <iframe src={pdfUrl} title={`${selectedStudentData?.name ?? 'Student'} summary report`} className="h-full min-h-[480px] w-full border-0" />}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <PdfViewerModal
        isOpen={fullScreen && phase === 'done'}
        onClose={() => setFullScreen(false)}
        src={pdfUrl}
        title={selectedStudentData?.name ?? 'Student summary'}
        subtitle={`Student summary · ${subtitle}`}
        actions={
          <button type="button" onClick={handleDownloadPdf} aria-label="Download PDF" className={`${primaryButton} h-9 px-3.5`}>
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        }
      />
    </>
  )
}

const StudentSummaryPage = () => (
  <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
    <StudentSummaryContent />
  </Suspense>
)

export default StudentSummaryPage
