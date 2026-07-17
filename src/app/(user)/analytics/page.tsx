'use client'

// Teacher Analytics — the configurable command center.
// Drill path: School Overview → Grade Cohort → Class → Student.
// All drill/filter state lives in the URL (useAnalyticsParams);
// the AI components read the current view via useAnalyticsStore.

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getTermsBySchool } from '@/services/termService'
import { TermPayload } from '@/services/types/term'
import { ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline'

import { useAnalyticsParams } from './_hooks/useAnalyticsParams'
import {
  useAnalyticsOverview,
  useAnalyticsClass,
  useAnalyticsStudent,
  useAnalyticsSnapshot,
} from './_hooks/useAnalyticsData'

import ControlBar from './_components/ControlBar'
import BreadcrumbNav from './_components/BreadcrumbNav'
import { SkeletonCard, SkeletonChart, SkeletonTable } from './_components/Skeletons'
import SchoolOverviewView from './_components/views/SchoolOverviewView'
import GradeCohortView from './_components/views/GradeCohortView'
import SubjectView from './_components/views/SubjectView'
import ClassView from './_components/views/ClassView'
import StudentView from './_components/views/StudentView'
import AiInsightsPanel from './_components/ai/AiInsightsPanel'
import AiChatDrawer from './_components/ai/AiChatDrawer'
import AtRiskWatchlist from './_components/ai/AtRiskWatchlist'
import AiReportComposer from './_components/ai/AiReportComposer'

const AnalyticsContent: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const setSnapshot = useAnalyticsStore((s) => s.setSnapshot)
  const params = useAnalyticsParams()

  const [terms, setTerms] = useState<TermPayload[]>([])
  const [termsLoading, setTermsLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  // ── Load terms once, seed termId from the active term ─────────────
  useEffect(() => {
    if (!user.school) return
    getTermsBySchool(user.school)
      .then((res) => {
        if (res.status === 'success') setTerms(res.data)
      })
      .catch(console.error)
      .finally(() => setTermsLoading(false))
  }, [user.school, selectedYearId]) // refetch when the selected school year changes

  useEffect(() => {
    if (!params.termId && terms.length > 0) {
      const active = terms.find((t) => t.isActive) ?? terms[0]
      params.setParams({ termId: active.termId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms, params.termId])

  // ── Clear the (URL-persisted) term when the header year changes ───
  // termId survives a year switch since it lives in the URL, so without this
  // the drill-down would keep showing the old year's term data until the
  // user manually picks a new term. Skip the initial mount/hydration — only
  // react to an actual change of selectedYearId after the page has loaded.
  const yearIdRef = useRef(selectedYearId)
  useEffect(() => {
    if (yearIdRef.current === selectedYearId) return
    yearIdRef.current = selectedYearId
    params.setParams({ termId: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId])

  // ── Data hooks (overview always — it powers school/grade views AND
  //    the control-bar filter lists; class/student fetch on demand) ──
  const overview = useAnalyticsOverview(params.termId, params.engine, params.compareTerm)

  // Grade + Subject that resolves to a single class → show that class's full
  // analytics inline (distribution, assessments, rankings) without an extra
  // click. classId stays derived (not in the URL) so the breadcrumb stays
  // School › Grade › Subject.
  const autoClassId = useMemo(() => {
    if (params.view !== 'subject' || !params.grade || !params.subject || !overview.data) return null
    const subj = overview.data.bySubject.find((s) => s.subject === params.subject)
    const inGrade = subj?.classes.filter((c) => c.grade === params.grade) ?? []
    return inGrade.length === 1 ? inGrade[0].classId : null
  }, [params.view, params.grade, params.subject, overview.data])

  const classDetail = useAnalyticsClass(
    params.view === 'class' ? params.classId : autoClassId,
    params.engine,
    params.termId
  )
  const studentDetail = useAnalyticsStudent(
    params.view === 'student' ? params.studentId : null,
    params.termId,
    params.engine,
    params.compareTerm
  )
  const snapshot = useAnalyticsSnapshot(params.termId, params.engine)

  const termName = useMemo(() => {
    if (params.termId === 'all') return 'All terms (combined)'
    const t = terms.find((x) => x.termId === params.termId)
    return t ? `${t.name} ${t.academicYear}` : 'Current term'
  }, [terms, params.termId])

  const compareTermName = useMemo(() => {
    const t = terms.find((x) => x.termId === params.compareTerm)
    return t ? `${t.name} ${t.academicYear}` : null
  }, [terms, params.compareTerm])

  // ── Keep the AI snapshot in sync with whatever is on screen ───────
  useEffect(() => {
    const base = {
      termName,
      compareTermName,
      engine: params.engine,
      selectedGrade: params.grade,
      selectedSubject: params.subject,
    }
    if (params.view === 'student' && studentDetail.data) {
      setSnapshot({ ...base, viewLevel: 'student', studentDetail: studentDetail.data })
    } else if ((params.view === 'class' || autoClassId) && classDetail.data) {
      // Class view, or a grade+subject combo that resolved to one class.
      setSnapshot({ ...base, viewLevel: 'class', classDetail: classDetail.data })
    } else if (overview.data) {
      const viewLevel =
        params.view === 'grade' ? 'grade' : params.view === 'subject' ? 'subject' : 'school'
      setSnapshot({ ...base, viewLevel, overview: overview.data })
    }
  }, [
    params.view,
    params.grade,
    params.subject,
    params.engine,
    autoClassId,
    overview.data,
    classDetail.data,
    studentDetail.data,
    termName,
    compareTermName,
    setSnapshot,
  ])

  // ── Control bar filter lists from overview data ───────────────────
  const grades = useMemo(() => overview.data?.byGrade.map((g) => g.grade) ?? [], [overview.data])
  // When a grade is selected, only offer subjects that actually have a class in
  // that grade — schools run different subjects per grade, so a school-wide
  // list would include subjects that error out for the current grade.
  const subjects = useMemo(() => {
    const all = overview.data?.bySubject ?? []
    const scoped = params.grade
      ? all.filter((s) => s.classes.some((c) => c.grade === params.grade))
      : all
    return scoped.map((s) => s.subject)
  }, [overview.data, params.grade])
  const allStudents = useMemo(
    () =>
      (overview.data?.byGrade ?? [])
        .flatMap((g) =>
          g.students.map((s) => ({ studentId: s.studentId, studentName: s.studentName, grade: g.grade }))
        )
        .sort((a, b) => a.studentName.localeCompare(b.studentName)),
    [overview.data]
  )

  // Labels for breadcrumbs
  const classLabel = classDetail.data
    ? `${classDetail.data.subject} (Gr ${classDetail.data.grade})`
    : null
  const studentLabel = studentDetail.data?.studentName ?? null

  // A class is on screen either via the class view or a grade+subject combo
  // that resolved to one class. Its heading reads "Grade 3 — Arabic — Term 1"
  // with the term in a smaller, lighter weight.
  const showingClass =
    (params.view === 'class' || (params.view === 'subject' && !!autoClassId)) && !!classDetail.data
  const classTermName = classDetail.data
    ? (terms.find((t) => t.termId === classDetail.data!.termId)?.name ?? null)
    : null

  // Human-readable scope of the current view (used by the AI report)
  const scopeLabel =
    params.view === 'student'
      ? studentLabel
        ? `${studentLabel} (Grade ${studentDetail.data?.gradeLevel})`
        : 'Student'
      : params.view === 'class'
        ? classLabel || 'Class'
        : params.view === 'grade'
          ? `Grade ${params.grade}`
          : params.view === 'subject'
            ? params.grade
              ? `Grade ${params.grade} ${params.subject}`
              : (params.subject ?? 'Subject')
            : 'Whole School'

  // ── Render helpers ─────────────────────────────────────────────────
  const activeError =
    params.view === 'class'
      ? classDetail.error
      : params.view === 'student'
        ? studentDetail.error
        : overview.error
  const activeRetry =
    params.view === 'class'
      ? classDetail.retry
      : params.view === 'student'
        ? studentDetail.retry
        : overview.retry
  const activeLoading =
    termsLoading ||
    (params.view === 'class'
      ? classDetail.loading || !classDetail.data
      : params.view === 'student'
        ? studentDetail.loading || !studentDetail.data
        : // subject view first needs overview; if it resolves to a single class,
          // also wait on that class's detail
          overview.loading ||
          !overview.data ||
          (autoClassId ? classDetail.loading || !classDetail.data : false))

  const aiPanel = <AiInsightsPanel />
  const atRiskPanel = (
    <AtRiskWatchlist
      snapshot={snapshot.data}
      loading={snapshot.loading}
      params={params}
      grade={params.view === 'grade' ? params.grade : null}
    />
  )

  return (
    <>
      <ControlBar
        params={params}
        terms={terms}
        grades={grades}
        subjects={subjects}
        students={allStudents}
        onOpenChat={() => setChatOpen(true)}
        onOpenReport={() => setReportOpen(true)}
      />

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <BreadcrumbNav params={params} classLabel={classLabel} studentLabel={studentLabel} />
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2">
              {showingClass && classDetail.data ? (
                <>
                  Grade {classDetail.data.grade} — {classDetail.data.subject}
                  {classTermName && (
                    <span className="text-lg lg:text-xl font-semibold text-slate-400">
                      {' '}— {classTermName}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {params.view === 'school' && 'School Analytics'}
                  {params.view === 'grade' && `Grade ${params.grade} Cohort`}
                  {params.view === 'subject' &&
                    (params.grade ? `Grade ${params.grade} — ${params.subject}` : params.subject || 'Subject Analytics')}
                  {params.view === 'class' && (classLabel || 'Class Analytics')}
                </>
              )}
              {params.view === 'student' && (studentLabel || 'Student Profile')}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {termName}
              {compareTermName ? ` · compared with ${compareTermName}` : ''} ·{' '}
              {params.engine === 'null_skip' ? 'ungraded work skipped' : 'ungraded counts as zero'}
            </p>
          </div>
          {/* One-tap reset back to the plain school overview (keeps term + engine) */}
          {(params.view !== 'school' || params.grade || params.subject || params.compareTerm) && (
            <button
              onClick={() =>
                params.setParams({
                  view: 'school',
                  grade: null,
                  subject: null,
                  classId: null,
                  studentId: null,
                  compareTerm: null,
                })
              }
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>

        {activeError ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-600 mb-4">{activeError}</p>
              <button
                onClick={activeRetry}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activeLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <SkeletonChart />
                <SkeletonTable rows={6} />
              </div>
              <div className="space-y-6">
                <SkeletonChart height={160} />
                <SkeletonTable rows={3} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {params.view === 'school' && overview.data && (
              <SchoolOverviewView
                overview={overview.data}
                params={params}
                aiPanel={aiPanel}
                atRiskPanel={atRiskPanel}
              />
            )}
            {params.view === 'grade' && overview.data && (
              <GradeCohortView
                overview={overview.data}
                params={params}
                aiPanel={aiPanel}
                atRiskPanel={atRiskPanel}
              />
            )}
            {params.view === 'subject' &&
              (autoClassId && classDetail.data ? (
                // Grade + subject narrowed to a single class — show it in full.
                <ClassView classData={classDetail.data} params={params} aiPanel={aiPanel} />
              ) : (
                overview.data && (
                  <SubjectView overview={overview.data} params={params} aiPanel={aiPanel} />
                )
              ))}
            {params.view === 'class' && classDetail.data && (
              <ClassView classData={classDetail.data} params={params} aiPanel={aiPanel} />
            )}
            {params.view === 'student' && studentDetail.data && (
              <StudentView student={studentDetail.data} params={params} aiPanel={aiPanel} />
            )}
          </>
        )}
      </div>

      <AiChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <AiReportComposer
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        schoolName={user.school ? getSchoolName(user.school) : 'School'}
        termName={termName}
        scopeLabel={scopeLabel}
        params={params}
        terms={terms}
        grades={grades}
        subjects={subjects}
        students={allStudents}
        dataLoading={activeLoading}
      />
    </>
  )
}

const AnalyticsPage: React.FC = () => (
  <>
    <Navbar />
    <Sidebar />
    <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <Spinner />
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </main>
  </>
)

export default AnalyticsPage
