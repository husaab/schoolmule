'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/modal' // adjust path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { bulkEnrollStudentsToClass } from '@/services/classService'
import { StudentPayload } from '@/services/types/student'
import { GradeValue, getGradeOptions } from '@/lib/schoolUtils'

interface ClassEnrollStudentModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** ID of the class we’re enrolling into */
  classId: string
  /** Grade of this class (used when “enroll all in grade” is checked) */
  classGrade: GradeValue
  /** Array of all students in the school */
  allStudents: StudentPayload[]
  /** Array of student IDs already enrolled, so we don’t show them */
  enrolledStudentIds: string[]
  /**
   * Called after a successful enroll.
   * Passes back exactly the array of studentIds that were enrolled.
   */
  onEnrolled: (newlyEnrolledIds: string[]) => void
}

const ClassEnrollStudentModal: React.FC<ClassEnrollStudentModalProps> = ({
  isOpen,
  onClose,
  classId,
  classGrade,
  allStudents,
  enrolledStudentIds,
  onEnrolled,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [loading, setLoading] = useState(false)

  // “Enroll all in this grade?” checkbox
  const [enrollAllInGrade, setEnrollAllInGrade] = useState(false)

  // Manual–selection state:
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  // Filter inputs (only used when enrollAllInGrade === false):
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGradeValue, setFilterGradeValue] = useState<string>('')

  // Whenever the modal opens, reset state:
  useEffect(() => {
    if (!isOpen) return
    setSelectedStudentIds([])
    setEnrollAllInGrade(false)
    setSearchTerm('')
    setFilterGradeValue('')
  }, [isOpen])

  // Compute whether there are any students in “classGrade” not yet enrolled:
  const eligibleForFullGradeEnroll = React.useMemo(() => {
    return allStudents.some(
      (stu) =>
        stu.grade === classGrade && !enrolledStudentIds.includes(stu.studentId)
    )
  }, [allStudents, enrolledStudentIds, classGrade])

  // Build “available” list whenever allStudents, enrolledStudentIds, searchTerm, or filterGradeValue change:
  const availableStudents = React.useMemo(() => {
    return allStudents
      // Exclude already‐enrolled
      .filter((stu) => !enrolledStudentIds.includes(stu.studentId))
      // Apply grade‐filter dropdown if set
      .filter((stu) =>
        filterGradeValue === ''
          ? true
          : stu.grade!.toString() === filterGradeValue
      )
      // Apply name search (case‐insensitive substring)
      .filter((stu) =>
        stu.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
  }, [allStudents, enrolledStudentIds, filterGradeValue, searchTerm])

  const toggleStudentSelection = (stuId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(stuId)
        ? prev.filter((id) => id !== stuId)
        : [...prev, stuId]
    )
  }

  const handleEnroll = async () => {
    setLoading(true)
    try {
      const payload: {
        enrollAllInGrade: boolean
        studentIds?: string[]
      } = {
        enrollAllInGrade,
      }
      if (!enrollAllInGrade) {
        payload.studentIds = selectedStudentIds
      }

      const res = await bulkEnrollStudentsToClass(classId, payload)
      if (res.status === 'success') {
        const newlyEnrolledIds = res.data.map((pair) => pair.studentId)
        showNotification(
          enrollAllInGrade
            ? `Enrolled all ${newlyEnrolledIds.length} student(s) in grade ${classGrade}.`
            : `Enrolled ${newlyEnrolledIds.length} student(s).`,
          'success'
        )
        onEnrolled(newlyEnrolledIds)
        onClose()
      } else {
        showNotification(res.message || 'Failed to enroll students', 'error')
      }
    } catch (err) {
      console.error('Error during bulk enrollment:', err)
      showNotification('Error enrolling students', 'error')
    } finally {
      setLoading(false)
    }
  }

  // “Enroll” button is enabled if:
  //  - Enrolling all AND at least one remains eligible, or
  //  - Not “enroll all” AND at least one is manually selected.
  const canSubmit =
    (enrollAllInGrade && eligibleForFullGradeEnroll) ||
    (!enrollAllInGrade && selectedStudentIds.length > 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl mb-4 text-black">Enroll Students</h2>

      {/* 1) “Enroll All in Grade” Checkbox */}
      <div className="flex items-center mb-2">
        <input
          id="enrollAll"
          type="checkbox"
          checked={enrollAllInGrade}
          onChange={() => setEnrollAllInGrade((prev) => !prev)}
          disabled={!eligibleForFullGradeEnroll}
          className="mr-2"
        />
        <label
          htmlFor="enrollAll"
          className={`text-black ${
            !eligibleForFullGradeEnroll ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Enroll all students in grade {classGrade}
        </label>
      </div>
      {/* If none are eligible, show a warning underneath */}
      {!eligibleForFullGradeEnroll && (
        <p className="text-red-600 mb-4">
          All students in grade {classGrade} are already enrolled.
        </p>
      )}

      {/* 2) If not “Enroll all,” show search + filter + checkboxes */}
      {!enrollAllInGrade && (
        <>
          {/* 2a) Search by name */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="Search by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white text-black"
            />

            {/* 2b) Filter by grade */}
            <select
              value={filterGradeValue}
              onChange={(e) => setFilterGradeValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white text-black"
            >
              <option value="">All Grades</option>
              {getGradeOptions().map((gradeOption) => (
                <option key={gradeOption.value} value={gradeOption.value.toString()}>
                  Grade {gradeOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2c) Scrollable student list with checkboxes */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-4 bg-white">
            {availableStudents.length === 0 ? (
              <p className="text-gray-600">No students match your filters.</p>
            ) : (
              availableStudents.map((stu) => (
                <div key={stu.studentId} className="flex items-center mb-2">
                  <input
                    id={`stu-${stu.studentId}`}
                    type="checkbox"
                    checked={selectedStudentIds.includes(stu.studentId)}
                    onChange={() => toggleStudentSelection(stu.studentId)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`stu-${stu.studentId}`}
                    className="text-black"
                  >
                    {stu.name} (Grade {stu.grade})
                  </label>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 3) Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleEnroll}
          disabled={!canSubmit || loading}
          className={`px-4 py-2 rounded-md transition cursor-pointer ${
            canSubmit
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Enrolling…' : 'Enroll'}
        </button>
      </div>
    </Modal>
  )
}

export default ClassEnrollStudentModal
