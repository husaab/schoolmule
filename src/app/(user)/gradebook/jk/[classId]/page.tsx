'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getClassById, getStudentsInClass } from '@/services/classService'
import {
  getJKDomains,
  getJKAssessments,
  bulkUpsertJKAssessments,
  getJKLearningSkills,
  bulkUpsertJKLearningSkills,
  getJKDomainComments,
  bulkUpsertJKDomainComments,
  getJKTeacherAssistant,
  upsertJKTeacherAssistant,
  getJKProgressReportComments,
  bulkUpsertJKProgressReportComments,
} from '@/services/jkService'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { JKDomain } from '@/services/types/jk'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import Link from 'next/link'

// Rating options for each document type
const PROGRESS_REPORT_RATINGS = [
  { value: '', label: '—' },
  { value: 'D', label: 'D' },
  { value: 'B', label: 'B' },
  { value: 'I', label: 'I' },
  { value: 'N', label: 'N' },
]

const REPORT_CARD_RATINGS = [
  { value: '', label: '—' },
  { value: 'BG', label: 'BG' },
  { value: 'DV', label: 'DV' },
  { value: 'NI', label: 'NI' },
]

const LEARNING_SKILL_RATINGS = [
  { value: '', label: '—' },
  { value: 'E', label: 'E' },
  { value: 'G', label: 'G' },
  { value: 'S', label: 'S' },
  { value: 'N', label: 'N' },
]

const LEARNING_SKILL_NAMES = [
  'Responsibility',
  'Organization',
  'Independent Work',
  'Initiative',
  'Collaboration',
  'Self-Regulation',
]

// Domains classified as socio-emotional for progress report comment sections
const SOCIO_EMOTIONAL_DOMAIN_NAMES = ['Social Skills', 'Emotional Development']

type TabType = 'progress_report' | 'report_card'

const JKGradebook = () => {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Core data
  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [domains, setDomains] = useState<JKDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Selection state
  const [activeTab, setActiveTab] = useState<TabType>('progress_report')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  // Rating state: skillId -> rating
  const [ratings, setRatings] = useState<Record<string, string>>({})
  // Domain comments: domainId -> comment
  const [domainComments, setDomainComments] = useState<Record<string, string>>({})
  // Learning skills: skillName -> rating
  const [learningSkills, setLearningSkills] = useState<Record<string, string>>({})
  // Teacher assistant
  const [teacherAssistant, setTeacherAssistant] = useState('')
  // Progress report comments: sectionType -> comment
  const [progressComments, setProgressComments] = useState<Record<string, string>>({})

  // AI generation state
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set())
  const [generatingAllAI, setGeneratingAllAI] = useState(false)

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false)

  const term = classData?.termName || ''

  // Load class and students on mount
  useEffect(() => {
    if (!classId) return

    setLoading(true)
    Promise.all([getClassById(classId), getStudentsInClass(classId)])
      .then(([classRes, stuRes]) => {
        if (classRes.status === 'success') setClassData(classRes.data)
        if (stuRes.status === 'success') {
          setStudents(stuRes.data)
          if (stuRes.data.length > 0) {
            setSelectedStudentId(stuRes.data[0].studentId)
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [classId])

  // Load domains when tab changes
  useEffect(() => {
    if (!user?.school) return
    getJKDomains(activeTab, user.school)
      .then((res) => {
        if (res.status === 'success') setDomains(res.data)
      })
      .catch(console.error)
  }, [activeTab, user?.school])

  // Load student data when student or tab changes
  const loadStudentData = useCallback(async () => {
    if (!selectedStudentId || !term) return

    try {
      // Clear stale state before loading new data
      setRatings({})
      setDomainComments({})
      setLearningSkills({})
      setProgressComments({})

      // Load skill assessments
      const assessRes = await getJKAssessments(selectedStudentId, term, activeTab)
      if (assessRes.status === 'success') {
        const map: Record<string, string> = {}
        assessRes.data.forEach((a) => {
          if (a.rating) map[a.skillId] = a.rating
        })
        setRatings(map)
      }

      // For report card tab, also load comments, learning skills, TA
      if (activeTab === 'report_card') {
        const [commentsRes, lsRes, taRes] = await Promise.all([
          getJKDomainComments(selectedStudentId, term),
          getJKLearningSkills(selectedStudentId, term),
          getJKTeacherAssistant(selectedStudentId, term),
        ])

        if (commentsRes.status === 'success') {
          const cmap: Record<string, string> = {}
          commentsRes.data.forEach((c) => {
            if (c.comment) cmap[c.domainId] = c.comment
          })
          setDomainComments(cmap)
        }

        if (lsRes.status === 'success') {
          const lmap: Record<string, string> = {}
          lsRes.data.forEach((ls) => {
            if (ls.rating) lmap[ls.skillName] = ls.rating
          })
          setLearningSkills(lmap)
        }

        if (taRes.status === 'success' && taRes.data) {
          setTeacherAssistant(taRes.data.teacherAssistantName || '')
        } else {
          setTeacherAssistant('')
        }
      }

      // For progress report tab, load progress report comments
      if (activeTab === 'progress_report') {
        try {
          const prCommentsRes = await getJKProgressReportComments(selectedStudentId, term)
          if (prCommentsRes.status === 'success') {
            const pmap: Record<string, string> = {}
            prCommentsRes.data.forEach((c) => {
              if (c.comment) pmap[c.sectionType] = c.comment
            })
            setProgressComments(pmap)
          }
        } catch {
          setProgressComments({})
        }
      }

      setHasChanges(false)
    } catch (err) {
      console.error('Error loading student data:', err)
    }
  }, [selectedStudentId, term, activeTab])

  useEffect(() => {
    loadStudentData()
  }, [loadStudentData])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Handlers
  const handleRatingChange = (skillId: string, value: string) => {
    setRatings((prev) => ({ ...prev, [skillId]: value }))
    setHasChanges(true)
  }

  const handleCommentChange = (domainId: string, value: string) => {
    setDomainComments((prev) => ({ ...prev, [domainId]: value }))
    setHasChanges(true)
  }

  const handleLearningSkillChange = (skillName: string, value: string) => {
    setLearningSkills((prev) => ({ ...prev, [skillName]: value }))
    setHasChanges(true)
  }

  const handleProgressCommentChange = (sectionType: string, value: string) => {
    setProgressComments((prev) => ({ ...prev, [sectionType]: value }))
    setHasChanges(true)
  }

  // Generate AI comment for a single domain or section
  const handleGenerateAIComment = async (
    key: string,
    domainName: string,
    skillsForPrompt: Array<{ name: string; rating: string; description?: string }>
  ) => {
    if (!selectedStudent) return

    const ratedSkills = skillsForPrompt.filter((s) => s.rating && s.rating !== '')
    if (ratedSkills.length === 0) {
      showNotification('Please rate at least one skill before generating a comment', 'error')
      return
    }

    setGeneratingAI((prev) => new Set(prev).add(key))
    try {
      const response = await fetch('/api/ai/generate-jksk-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          domainName,
          skills: ratedSkills,
          ratingScale: activeTab === 'progress_report' ? 'DBIN' : 'BGDVNI',
          gradeLevel: classData?.grade || 'JK',
          documentType: activeTab,
          learningSkills: activeTab === 'report_card'
            ? LEARNING_SKILL_NAMES.filter((n) => learningSkills[n]).map((n) => ({
                name: n,
                rating: learningSkills[n],
              }))
            : undefined,
          term: term || 'Current Term',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate comment')

      const data = await response.json()
      if (data.comment) {
        if (activeTab === 'report_card') {
          handleCommentChange(key, data.comment)
        } else {
          handleProgressCommentChange(key, data.comment)
        }
        showNotification('Comment generated successfully', 'success')
      } else {
        throw new Error('No comment returned')
      }
    } catch (err) {
      console.error('AI generation failed:', err)
      showNotification('Failed to generate comment. Please try again.', 'error')
    } finally {
      setGeneratingAI((prev) => {
        const updated = new Set(prev)
        updated.delete(key)
        return updated
      })
    }
  }

  // Generate AI comments for all domains/sections at once
  const handleGenerateAllComments = async () => {
    if (!selectedStudent) return

    setGeneratingAllAI(true)

    if (activeTab === 'report_card') {
      // Generate for each domain that has ratings
      const domainPromises = domains
        .filter((domain) => domain.skills.some((s) => ratings[s.skillId]))
        .map((domain) => {
          const skillsForPrompt = domain.skills
            .filter((s) => ratings[s.skillId])
            .map((s) => ({
              name: s.name,
              rating: ratings[s.skillId],
              description: s.description || undefined,
            }))
          return handleGenerateAIComment(domain.domainId, domain.name, skillsForPrompt)
        })

      await Promise.allSettled(domainPromises)
    } else {
      // Progress report: generate for both sections
      const academicDomains = domains.filter(
        (d) => !SOCIO_EMOTIONAL_DOMAIN_NAMES.includes(d.name)
      )
      const socioEmotionalDomains = domains.filter((d) =>
        SOCIO_EMOTIONAL_DOMAIN_NAMES.includes(d.name)
      )

      const promises: Promise<void>[] = []

      // Academic Achievement
      const academicSkills = academicDomains.flatMap((d) =>
        d.skills.filter((s) => ratings[s.skillId]).map((s) => ({
          name: s.name,
          rating: ratings[s.skillId],
        }))
      )
      if (academicSkills.length > 0) {
        promises.push(
          handleGenerateAIComment('academic_achievement', 'Academic Achievement', academicSkills)
        )
      }

      // Socio-Emotional Development
      const socioSkills = socioEmotionalDomains.flatMap((d) =>
        d.skills.filter((s) => ratings[s.skillId]).map((s) => ({
          name: s.name,
          rating: ratings[s.skillId],
        }))
      )
      if (socioSkills.length > 0) {
        promises.push(
          handleGenerateAIComment('socio_emotional', 'Socio-Emotional Development', socioSkills)
        )
      }

      await Promise.allSettled(promises)
    }

    setGeneratingAllAI(false)
  }

  const handleSave = async () => {
    if (!selectedStudentId || !user?.school) return

    setSaving(true)
    try {
      // Save skill assessments
      const assessmentEntries = Object.entries(ratings)
        .filter(([, val]) => val !== '')
        .map(([skillId, rating]) => ({
          studentId: selectedStudentId,
          skillId,
          term,
          rating,
          school: user.school!,
          assessedBy: user.id,
        }))

      if (assessmentEntries.length > 0) {
        await bulkUpsertJKAssessments(assessmentEntries)
      }

      // For progress report, save progress report comments
      if (activeTab === 'progress_report') {
        const prCommentEntries = Object.entries(progressComments)
          .filter(([, val]) => val && val.trim() !== '')
          .map(([sectionType, comment]) => ({
            studentId: selectedStudentId,
            term,
            sectionType: sectionType as 'academic_achievement' | 'socio_emotional',
            comment,
            school: user.school!,
          }))

        if (prCommentEntries.length > 0) {
          await bulkUpsertJKProgressReportComments(prCommentEntries)
        }
      }

      // For report card, also save comments, learning skills, TA
      if (activeTab === 'report_card') {
        const commentEntries = Object.entries(domainComments)
          .filter(([, val]) => val && val.trim() !== '')
          .map(([domainId, comment]) => ({
            studentId: selectedStudentId,
            domainId,
            term,
            comment,
            school: user.school!,
          }))

        if (commentEntries.length > 0) {
          await bulkUpsertJKDomainComments(commentEntries)
        }

        const lsEntries = Object.entries(learningSkills)
          .filter(([, val]) => val !== '')
          .map(([skillName, rating]) => ({
            studentId: selectedStudentId,
            term,
            skillName,
            rating,
            school: user.school!,
          }))

        if (lsEntries.length > 0) {
          await bulkUpsertJKLearningSkills(lsEntries)
        }

        if (teacherAssistant !== undefined) {
          await upsertJKTeacherAssistant({
            studentId: selectedStudentId,
            teacherAssistantName: teacherAssistant || null,
            term,
            school: user.school!,
          })
        }
      }

      setHasChanges(false)
      showNotification('Saved successfully', 'success')
    } catch (err) {
      console.error('Error saving:', err)
      showNotification('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStudentSwitch = async (studentId: string) => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Switch student without saving?')
      if (!confirmed) return
    }
    setSelectedStudentId(studentId)
  }

  const handleTabChange = (tab: TabType) => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Switch tab without saving?')
      if (!confirmed) return
    }
    setActiveTab(tab)
  }

  const ratingOptions = activeTab === 'progress_report' ? PROGRESS_REPORT_RATINGS : REPORT_CARD_RATINGS
  const selectedStudent = students.find((s) => s.studentId === selectedStudentId)

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 flex items-center justify-center">
          <Spinner size="lg" />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/gradebook"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Gradebook
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {classData?.subject || (classData?.grade === 'JK' ? 'Junior Kindergarten' : 'Senior Kindergarten')}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {classData?.teacherName} &middot; {term}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <span className="text-amber-600 text-sm font-medium">Unsaved changes</span>
                )}
                {selectedStudentId && (
                  <button
                    onClick={handleGenerateAllComments}
                    disabled={generatingAllAI || generatingAI.size > 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <SparklesIcon className={`w-4 h-4 ${generatingAllAI ? 'animate-pulse' : ''}`} />
                    {generatingAllAI ? 'Generating...' : 'Generate All AI Comments'}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {saving ? <Spinner size="sm" /> : <CheckCircleIcon className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => handleTabChange('progress_report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'progress_report'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Progress Report (D/B/I/N)
            </button>
            <button
              onClick={() => handleTabChange('report_card')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'report_card'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Report Card (BG/DV/NI)
            </button>
          </div>

          <div className="flex gap-6">
            {/* Student Sidebar */}
            <div className="w-56 flex-shrink-0">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm sticky top-28">
                <div className="p-3 border-b border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Students ({students.length})
                  </h3>
                </div>
                <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                  {students.map((stu) => (
                    <button
                      key={stu.studentId}
                      onClick={() => handleStudentSwitch(stu.studentId)}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                        selectedStudentId === stu.studentId
                          ? 'bg-emerald-50 text-emerald-700 font-medium border-r-2 border-emerald-500'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{stu.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {!selectedStudentId ? (
                <div className="text-center py-12 text-slate-500">
                  Select a student to begin assessment
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sticky: Student Header + Legend */}
                  <div className="sticky top-20 z-10 space-y-2">
                    {/* Student Header */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{selectedStudent?.name}</p>
                        <p className="text-xs text-slate-500">
                          OEN: {selectedStudent?.oen || 'N/A'} &middot;
                          {classData?.grade === 'JK' ? 'Junior Kindergarten' : 'Senior Kindergarten'}
                        </p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scale</span>
                        {activeTab === 'progress_report' ? (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-green-50 rounded text-green-700"><strong>D</strong> Developing</span>
                            <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-700"><strong>B</strong> Beginning</span>
                            <span className="px-2 py-0.5 bg-amber-50 rounded text-amber-700"><strong>I</strong> Improvement needed</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600"><strong>N</strong> Not Assessed</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-700"><strong>BG</strong> Beginning</span>
                            <span className="px-2 py-0.5 bg-green-50 rounded text-green-700"><strong>DV</strong> Developing</span>
                            <span className="px-2 py-0.5 bg-amber-50 rounded text-amber-700"><strong>NI</strong> Needs Improvement</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Assistant (report card only) */}
                  {activeTab === 'report_card' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Teacher Assistant (optional)
                      </label>
                      <input
                        type="text"
                        value={teacherAssistant}
                        onChange={(e) => {
                          setTeacherAssistant(e.target.value)
                          setHasChanges(true)
                        }}
                        placeholder="Enter teacher assistant name"
                        className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Domain Cards */}
                  {domains.map((domain) => (
                    <div
                      key={domain.domainId}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                        <h3 className="text-white font-semibold text-sm">{domain.name}</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {activeTab === 'report_card' ? (
                          /* Report Card: Learning Goal + Description + Rating */
                          <>
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              <div className="col-span-4">Learning Goal</div>
                              <div className="col-span-5">Description</div>
                              <div className="col-span-3 text-center">Rating</div>
                            </div>
                            {domain.skills.map((skill) => (
                              <div
                                key={skill.skillId}
                                className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-50 transition-colors"
                              >
                                <div className="col-span-4 text-sm font-medium text-slate-700">
                                  {skill.name}
                                </div>
                                <div className="col-span-5 text-sm text-slate-500">
                                  {skill.description || ''}
                                </div>
                                <div className="col-span-3 flex justify-center">
                                  <select
                                    value={ratings[skill.skillId] || ''}
                                    onChange={(e) => handleRatingChange(skill.skillId, e.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center w-20 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  >
                                    {ratingOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          /* Progress Report: Skill + Rating */
                          domain.skills.map((skill) => (
                            <div
                              key={skill.skillId}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-sm text-slate-700">{skill.name}</span>
                              <select
                                value={ratings[skill.skillId] || ''}
                                onChange={(e) => handleRatingChange(skill.skillId, e.target.value)}
                                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center w-20 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              >
                                {ratingOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Domain Comment (report card only) */}
                      {activeTab === 'report_card' && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-slate-500">
                              Teacher Comment
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const skillsForPrompt = domain.skills
                                  .filter((s) => ratings[s.skillId])
                                  .map((s) => ({
                                    name: s.name,
                                    rating: ratings[s.skillId],
                                    description: s.description || undefined,
                                  }))
                                handleGenerateAIComment(domain.domainId, domain.name, skillsForPrompt)
                              }}
                              disabled={
                                generatingAI.has(domain.domainId) ||
                                !domain.skills.some((s) => ratings[s.skillId])
                              }
                              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <SparklesIcon
                                className={`w-3.5 h-3.5 ${generatingAI.has(domain.domainId) ? 'animate-pulse' : ''}`}
                              />
                              {generatingAI.has(domain.domainId) ? 'Generating...' : 'Generate with AI'}
                            </button>
                          </div>
                          <textarea
                            value={domainComments[domain.domainId] || ''}
                            onChange={(e) => handleCommentChange(domain.domainId, e.target.value)}
                            rows={3}
                            placeholder="Click 'Generate with AI' or type your own comment..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Progress Report Comment Sections (progress report only) */}
                  {activeTab === 'progress_report' && (
                    <div className="space-y-4">
                      {/* Academic Achievement */}
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                          <h3 className="text-white font-semibold text-sm">Academic Achievement</h3>
                        </div>
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-slate-500">
                              Teacher Comment
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const academicDomains = domains.filter(
                                  (d) => !SOCIO_EMOTIONAL_DOMAIN_NAMES.includes(d.name)
                                )
                                const skillsForPrompt = academicDomains.flatMap((d) =>
                                  d.skills.filter((s) => ratings[s.skillId]).map((s) => ({
                                    name: s.name,
                                    rating: ratings[s.skillId],
                                  }))
                                )
                                handleGenerateAIComment(
                                  'academic_achievement',
                                  'Academic Achievement',
                                  skillsForPrompt
                                )
                              }}
                              disabled={
                                generatingAI.has('academic_achievement') ||
                                !domains
                                  .filter((d) => !SOCIO_EMOTIONAL_DOMAIN_NAMES.includes(d.name))
                                  .some((d) => d.skills.some((s) => ratings[s.skillId]))
                              }
                              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <SparklesIcon
                                className={`w-3.5 h-3.5 ${generatingAI.has('academic_achievement') ? 'animate-pulse' : ''}`}
                              />
                              {generatingAI.has('academic_achievement') ? 'Generating...' : 'Generate with AI'}
                            </button>
                          </div>
                          <textarea
                            value={progressComments['academic_achievement'] || ''}
                            onChange={(e) =>
                              handleProgressCommentChange('academic_achievement', e.target.value)
                            }
                            rows={3}
                            placeholder="Click 'Generate with AI' or type your own comment..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                          />
                        </div>
                      </div>

                      {/* Socio-Emotional Development */}
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3">
                          <h3 className="text-white font-semibold text-sm">
                            Socio-Emotional Development
                          </h3>
                        </div>
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-slate-500">
                              Teacher Comment
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const socioDomains = domains.filter((d) =>
                                  SOCIO_EMOTIONAL_DOMAIN_NAMES.includes(d.name)
                                )
                                const skillsForPrompt = socioDomains.flatMap((d) =>
                                  d.skills.filter((s) => ratings[s.skillId]).map((s) => ({
                                    name: s.name,
                                    rating: ratings[s.skillId],
                                  }))
                                )
                                handleGenerateAIComment(
                                  'socio_emotional',
                                  'Socio-Emotional Development',
                                  skillsForPrompt
                                )
                              }}
                              disabled={
                                generatingAI.has('socio_emotional') ||
                                !domains
                                  .filter((d) => SOCIO_EMOTIONAL_DOMAIN_NAMES.includes(d.name))
                                  .some((d) => d.skills.some((s) => ratings[s.skillId]))
                              }
                              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <SparklesIcon
                                className={`w-3.5 h-3.5 ${generatingAI.has('socio_emotional') ? 'animate-pulse' : ''}`}
                              />
                              {generatingAI.has('socio_emotional') ? 'Generating...' : 'Generate with AI'}
                            </button>
                          </div>
                          <textarea
                            value={progressComments['socio_emotional'] || ''}
                            onChange={(e) =>
                              handleProgressCommentChange('socio_emotional', e.target.value)
                            }
                            rows={3}
                            placeholder="Click 'Generate with AI' or type your own comment..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Learning Skills Section (report card only) */}
                  {activeTab === 'report_card' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3">
                        <h3 className="text-white font-semibold text-sm">
                          Learning Skills (E/G/S/N)
                        </h3>
                      </div>
                      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500">
                        E = Excellent &middot; G = Good &middot; S = Satisfactory &middot; N = Needs Improvement
                      </div>
                      <div className="divide-y divide-slate-100">
                        {LEARNING_SKILL_NAMES.map((skillName) => (
                          <div
                            key={skillName}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-slate-700">{skillName}</span>
                            <select
                              value={learningSkills[skillName] || ''}
                              onChange={(e) => handleLearningSkillChange(skillName, e.target.value)}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center w-20 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                              {LEARNING_SKILL_RATINGS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Save Bar */}
                  {hasChanges && (
                    <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center justify-between">
                      <span className="text-sm text-amber-600 font-medium">
                        You have unsaved changes for {selectedStudent?.name}
                      </span>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {saving ? <Spinner size="sm" /> : <CheckCircleIcon className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default JKGradebook
