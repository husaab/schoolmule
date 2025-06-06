'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'

import {
  getClassById,
  getStudentsInClass,
  getAssessmentsByClass,
  getScoresByClass,
  upsertScoresByClass,
  downloadGradebookExcel
} from '@/services/classService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { ClassPayload } from '@/services/types/class'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPayload } from '@/services/types/assessment'
import OpenFeedBackModal from '@/components/feedback/openFeedbackModal';

interface ScoreRow {
  student_id: string
  student_name: string
  assessment_id: string
  assessment_name: string
  weight_percent: number
  score: number | null
}

const GradebookClass = () => {
  const { classId } = useParams() as { classId: string }
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [classData, setClassData] = useState<ClassPayload | null>(null)
  const [students, setStudents] = useState<StudentPayload[]>([])
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([])
  const [scoresMatrix, setScoresMatrix] = useState<ScoreRow[]>([])

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Edited scores: keyed by "studentId|assessmentId" → number or '' (empty means “no entry yet”)
  const [editedScores, setEditedScores] = useState<{ [key: string]: number | '' }>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!classId) return

    setLoading(true)
    setError(null)

    Promise.all([
      getClassById(classId),
      getStudentsInClass(classId),
      getAssessmentsByClass(classId),
      getScoresByClass(classId),
    ])
      .then(([classRes, stuRes, assessRes, scoreRes]) => {
        if (classRes.status !== 'success') {
          throw new Error(classRes.message || 'Failed to load class info')
        }
        setClassData(classRes.data)

        if (stuRes.status !== 'success') {
          throw new Error(stuRes.message || 'Failed to load students')
        }
        setStudents(stuRes.data)

        if (assessRes.status !== 'success') {
          throw new Error(assessRes.message || 'Failed to load assessments')
        }
        setAssessments(assessRes.data)

        if (scoreRes.status !== 'success') {
          throw new Error(scoreRes.message || 'Failed to load scores')
        }
        setScoresMatrix(scoreRes.data)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Unexpected error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [classId])

  if (error) {
    return (
      <div className="ml-32 bg-white min-h-screen p-10 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push('/gradebook')}
          className="mt-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Back to Gradebook
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="ml-32 bg-white min-h-screen p-10 text-center">
        <p className="text-gray-600">Loading gradebook data…</p>
      </div>
    )
  }

  if (!classData) return null

  // 1) Build a quick lookup: "studentId|assessmentId" → existing score (or null)
  const existingScoreMap: Record<string, number | null> = {}
  scoresMatrix.forEach((row) => {
    const key = `${row.student_id}|${row.assessment_id}`
    existingScoreMap[key] = row.score
  })

  const handleExportExcel = async () => {
    try {
      // 1) Call our “downloadGradebookExcel” service which returns a Blob
      const blob = await downloadGradebookExcel(classId);

      // 2) Compose a filename of the form: gradebook_{grade}_{subject}.xlsx
      const safeSubject = String(classData.subject)
        .trim()
        .replace(/\s+/g, '_'); // e.g. "Science 101" → "Science_101"
      const fileName = `Gradebook_Grade_${classData.grade}_${safeSubject}.xlsx`;

      // 3) Create an object URL and force a download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to download Excel sheet');
    }
  };

  // 2) Whenever the teacher types into a cell, store it in editedScores
  const handleScoreChange = (
    studentId: string,
    assessmentId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value

    // If blank, keep it as '' so we don’t force a zero right away
    let val: number | '' = ''
    if (raw !== '') {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        // Clamp between 0 and 100
        val = Math.min(Math.max(parsed, 0), 100)
      } else {
        val = ''
      }
    }

    const compositeKey = `${studentId}|${assessmentId}`
    setEditedScores((prev) => ({
      ...prev,
      [compositeKey]: val,
    }))
  }

  // 3) Sum up each assessment’s contribution for a given student (score × weight/100)
  const computeTotalForStudent = (studentId: string) => {
    let total = 0
    assessments.forEach((a) => {
      const key = `${studentId}|${a.assessmentId}`

      // If the teacher has typed something, use editedScores[key]; otherwise fall back to existingScoreMap
      const rawValue =
        editedScores[key] !== undefined
          ? editedScores[key]
          : existingScoreMap[key] ?? null

      const scoreNumber =
        typeof rawValue === 'number'
            ? rawValue
            : rawValue !== null && rawValue !== undefined
            ? parseFloat(String(rawValue)) || 0
            : 0
      total += (scoreNumber * a.weightPercent) / 100
    })
    return total
  }

  // 4) When “Save All Changes” is clicked, only upsert the cells that actually changed
  const handleSaveAll = async () => {
    setSaving(true)
    setError(null)

    const toUpsert: Array<{ studentId: string; assessmentId: string; score: number }> = []

    Object.entries(editedScores).forEach(([compositeKey, newScore]) => {
      const [stuId, assessId] = compositeKey.split('|')
      const existing = existingScoreMap[compositeKey] ?? null

      if (typeof newScore === 'number' && newScore !== existing) {
        toUpsert.push({
          studentId: stuId,
          assessmentId: assessId,
          score: newScore,
        })
      }
    })

    if (toUpsert.length === 0) {
      setSaving(false)
      return
    }

    try {
      await upsertScoresByClass(classId, toUpsert)
      const refreshed = await getScoresByClass(classId)
      if (refreshed.status === 'success') {
        setScoresMatrix(refreshed.data)
        setEditedScores({})
      } else {
        throw new Error(refreshed.message || 'Failed to refresh scores')
      }
      showNotification('Grades successfully saved', 'success')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error saving scores')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-32 bg-white min-h-screen p-10">
        <div className="pt-40 mb-8 text-black text-center">
          <h1 className="text-3xl font-semibold">
            Gradebook: {classData.subject} – Grade {classData.grade}
          </h1>
          <p className="text-gray-600 mt-1">
            {students.length} students &ndash; {assessments.length}{' '}
            {assessments.length === 1 ? 'assessment' : 'assessments'}
          </p>
        </div>

        <div className="mx-auto w-[80%] overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full table-auto whitespace-nowrap">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700">
                  Student Name
                </th>
                {assessments.map((a: AssessmentPayload) => (
                  <th
                    key={a.assessmentId}
                    className="px-4 py-2 text-center text-gray-700 whitespace-nowrap"
                  >
                    <div className="truncate">{a.name}</div>
                    <div className="text-xs text-gray-500">
                      ({a.weightPercent}%)
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 text-center text-gray-700">Total</th>
                <th className="px-4 py-2 text-center text-gray-700">Feedback</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + assessments.length}
                    className="px-4 py-6 text-center text-gray-600"
                  >
                    No students are currently enrolled in this class.
                  </td>
                </tr>
              ) : (
                students.map((stu) => {
                  const total = computeTotalForStudent(stu.studentId)
                  return (
                    <tr
                      key={stu.studentId}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 text-gray-800">
                        {stu.name}
                      </td>

                      {assessments.map((a: AssessmentPayload) => {
                        const key = `${stu.studentId}|${a.assessmentId}`
                        const currentValue =
                          editedScores[key] !== undefined
                            ? editedScores[key]
                            : existingScoreMap[key] ?? ''

                        return (
                          <td
                            key={a.assessmentId}
                            className="px-1 py-1 text-center text-gray-800"
                          >
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="w-16 border border-gray-300 rounded p-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
                              value={currentValue}
                              onChange={(e) =>
                                handleScoreChange(
                                  stu.studentId,
                                  a.assessmentId,
                                  e
                                )
                              }
                            />
                          </td>
                        )
                      })}

                      <td className="px-4 py-2 text-center text-gray-800">
                        {/* Show the weighted total with one decimal place: */}
                        {total.toFixed(1)}%
                      </td>

                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentId(stu.studentId);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="text-sm px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded cursor-pointer"
                        >
                          Feedback
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex ml-42 space-x-4">
          <button
            onClick={() => router.push('/gradebook')}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(editedScores).length === 0}
            className={`px-4 py-2 rounded text-white cursor-pointer ${
              saving || Object.keys(editedScores).length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            Export as CSV
          </button>
        </div>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </main>

      {selectedStudentId && (
        <OpenFeedBackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          studentId={selectedStudentId}
          classId={classId}
        />
      )}
    </>
  )
}

export default GradebookClass
