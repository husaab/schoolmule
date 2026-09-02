'use client'

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/modal' // adjust path if needed
import { useNotificationStore } from '@/store/useNotificationStore'
import { bulkEnrollStudentsToClass } from '@/services/classService'
import { StudentPayload } from '@/services/types/student'
import { GradeValue, getGradeOptions, getGradeDisplayName } from '@/lib/schoolUtils'
import {
  Button,
  Field,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
  selectClass,
} from '../../../shared/modalKit'
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline'

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
      // A student with no grade on file matches only the "all grades" option —
      // never a specific one. (Reading .toString() off a null grade used to throw.)
      .filter((stu) =>
        filterGradeValue === ''
          ? true
          : String(stu.grade ?? '') === filterGradeValue
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

  // Only used to tell an empty search apart from a fully enrolled school,
  // so the empty state can say which one the reader is looking at.
  const isFiltering = searchTerm.trim() !== '' || filterGradeValue !== ''
  const selectedCount = selectedStudentIds.length

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Enroll students"
        subtitle="Pick students one by one, or take the whole grade at once."
        icon={UserPlusIcon}
      />

      <ModalBody>
        {/* 1) “Enroll All in Grade” — the shortcut that does the most work,
            so it gets its own surface above the manual list. */}
        <label
          className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
            eligibleForFullGradeEnroll
              ? 'cursor-pointer border-cyan-100 bg-cyan-50/60 hover:bg-cyan-50'
              : 'cursor-not-allowed border-slate-100 bg-slate-50/70'
          }`}
        >
          <input
            id="enrollAll"
            type="checkbox"
            checked={enrollAllInGrade}
            onChange={() => setEnrollAllInGrade((prev) => !prev)}
            disabled={!eligibleForFullGradeEnroll}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
          />
          <span className="text-sm">
            <span
              className={`font-medium ${
                eligibleForFullGradeEnroll ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              Enroll every {getGradeDisplayName(classGrade)} student
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {eligibleForFullGradeEnroll
                ? 'Anyone already on the roster is skipped.'
                : `Every ${getGradeDisplayName(classGrade)} student is already enrolled — pick from another grade below.`}
            </span>
          </span>
        </label>

        {/* 2) If not “Enroll all,” show search + filter + checkboxes */}
        {!enrollAllInGrade && (
          <>
            {/* 2a) Search by name + 2b) filter by grade */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Field label="Find a student" htmlFor="enroll-search">
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="enroll-search"
                      type="text"
                      placeholder="Search by name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>
              </div>

              <div className="w-40">
                <Field label="Grade" htmlFor="enroll-grade-filter">
                  <select
                    id="enroll-grade-filter"
                    value={filterGradeValue}
                    onChange={(e) => setFilterGradeValue(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All grades</option>
                    {getGradeOptions().map((gradeOption) => (
                      <option key={gradeOption.value} value={gradeOption.value.toString()}>
                        {getGradeDisplayName(gradeOption.value)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* 2c) Scrollable student list with checkboxes */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Not yet enrolled
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {selectedCount === 0
                    ? 'None selected'
                    : `${selectedCount} selected`}
                </p>
              </div>

              {availableStudents.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    {isFiltering
                      ? 'No students match that search'
                      : 'Everyone is already enrolled'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isFiltering
                      ? 'Try a different name, or set the grade filter back to all grades.'
                      : 'Every student in the school is on this roster already. Add a new student first, then enroll them here.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {availableStudents.map((stu) => {
                    const isSelected = selectedStudentIds.includes(stu.studentId)
                    return (
                      <label
                        key={stu.studentId}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                          isSelected
                            ? 'border-cyan-200 bg-cyan-50/70'
                            : 'border-slate-100 bg-slate-50/70 hover:bg-white'
                        }`}
                      >
                        <input
                          id={`stu-${stu.studentId}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(stu.studentId)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                          {stu.name}
                        </span>
                        <span className="flex-shrink-0 text-xs text-slate-500">
                          {getGradeDisplayName(stu.grade) || 'No grade'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </ModalBody>

      {/* 3) Actions */}
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEnroll} loading={loading} disabled={!canSubmit}>
          {loading
            ? 'Enrolling'
            : !enrollAllInGrade && selectedCount > 0
              ? `Enroll ${selectedCount} student${selectedCount === 1 ? '' : 's'}`
              : 'Enroll students'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ClassEnrollStudentModal
