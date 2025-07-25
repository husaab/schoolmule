'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/shared/modal'
import { createTuitionInvoice } from '@/services/tuitionInvoiceService'
import { getTuitionPlansBySchool } from '@/services/tuitionPlanService'
import { getAllStudents } from '@/services/studentService'
import { getParentsByStudentId } from '@/services/parentStudentService'
import { TuitionInvoiceRequest } from '@/services/types/tuitionInvoice'
import { TuitionPlanPayload } from '@/services/types/tuitionPlan'
import { StudentPayload } from '@/services/types/student'
import { ParentStudentPayload } from '@/services/types/parentStudent'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { CalendarIcon, UserIcon, DocumentPlusIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface GenerateIndividualInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerated: () => void
}

const GenerateIndividualInvoiceModal: React.FC<GenerateIndividualInvoiceModalProps> = ({
  isOpen,
  onClose,
  onGenerated
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  const [students, setStudents] = useState<StudentPayload[]>([])
  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlanPayload[]>([])
  const [parentRelations, setParentRelations] = useState<ParentStudentPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadingParents, setLoadingParents] = useState(false)

  const [formData, setFormData] = useState({
    studentId: '',
    planId: '',
    periodStart: '',
    periodEnd: '',
    dateDue: ''
  })

  // Search and filter state
  const [searchStudent, setSearchStudent] = useState('')
  const [filterGrade, setFilterGrade] = useState('')

  const selectedStudent = students.find(s => s.studentId === formData.studentId)
  const selectedPlan = tuitionPlans.find(p => p.planId === formData.planId)
  const primaryParent = parentRelations.length > 0 ? parentRelations[0] : null

  // Load students and tuition plans
  useEffect(() => {
    if (!isOpen || !user.school) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [studentsResponse, plansResponse] = await Promise.all([
          getAllStudents(user.school!),
          getTuitionPlansBySchool(user.school!)
        ])

        if (studentsResponse.status === 'success') {
          setStudents(studentsResponse.data)
        }
        if (plansResponse.status === 'success') {
          // Filter active plans only
          const activePlans = plansResponse.data.filter(plan => {
            const now = new Date()
            const effectiveFrom = new Date(plan.effectiveFrom)
            const effectiveTo = plan.effectiveTo ? new Date(plan.effectiveTo) : null
            return effectiveFrom <= now && (!effectiveTo || effectiveTo >= now)
          })
          setTuitionPlans(activePlans)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        showNotification('Error loading students and plans', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, user.school, showNotification])

  // Load parents when student is selected
  useEffect(() => {
    if (!formData.studentId) {
      setParentRelations([])
      return
    }

    const loadParents = async () => {
      setLoadingParents(true)
      try {
        const response = await getParentsByStudentId(formData.studentId)
        if (response.status === 'success') {
          setParentRelations(response.data!)
        } else {
          setParentRelations([])
        }
      } catch (error) {
        console.error('Error loading parents:', error)
        setParentRelations([])
      } finally {
        setLoadingParents(false)
      }
    }

    loadParents()
  }, [formData.studentId])

  // Auto-generate period end when period start changes
  useEffect(() => {
    if (formData.periodStart) {
      const startDate = new Date(formData.periodStart)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0) // Last day of month
      setFormData(prev => ({
        ...prev,
        periodEnd: endDate.toISOString().split('T')[0]
      }))
    }
  }, [formData.periodStart])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreate = async () => {
    if (!formData.studentId || !formData.planId || !formData.periodStart || !formData.dateDue) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    if (!selectedStudent || !selectedPlan) {
      showNotification('Invalid student or plan selection', 'error')
      return
    }

    setCreating(true)

    try {
      const payload: TuitionInvoiceRequest = {
        planId: formData.planId,
        studentId: formData.studentId,
        studentName: selectedStudent.name,
        studentGrade: selectedStudent.grade!.toString(),
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        amountDue: selectedPlan.amount,
        dateDue: formData.dateDue,
        status: 'pending',
        school: user.school!
      }

      // Add parent information from parent-student relationship (use first parent if available)
      if (primaryParent) {
        payload.parentId = primaryParent.parentId || undefined
        payload.parentName = primaryParent.parentName || undefined
        payload.parentEmail = primaryParent.parentEmail || undefined
        payload.parentNumber = primaryParent.parentNumber || undefined
      }

      console.log('Creating invoice with payload:', payload)
      const response = await createTuitionInvoice(payload)
      
      if (response.status === 'success') {
        showNotification('Invoice created successfully', 'success')
        handleClose()
        onGenerated()
      } else {
        showNotification(response.message || 'Failed to create invoice', 'error')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      showNotification('Error creating invoice', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setFormData({
      studentId: '',
      planId: '',
      periodStart: '',
      periodEnd: '',
      dateDue: ''
    })
    setSearchStudent('')
    setFilterGrade('')
    setParentRelations([])
    onClose()
  }

  // Get unique grades from students
  const grades = useMemo(
    () => Array.from(new Set(students.map(s => s.grade).filter(g => g != null)))
      .sort((a, b) => (a! - b!)).map(g => g!.toString()),
    [students]
  )

  // Filter students by search and grade
  const filteredStudents = useMemo(
    () => students
      .filter(s => filterGrade === '' || s.grade?.toString() === filterGrade)
      .filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase())),
    [students, searchStudent, filterGrade]
  )

  // Filter tuition plans by selected student's grade
  const availablePlans = selectedStudent 
    ? tuitionPlans.filter(plan => plan.grade === selectedStudent.grade!.toString())
    : tuitionPlans

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style="p-6 max-w-lg w-11/12">
      <div className="text-black">
        <div className="flex items-center mb-4">
          <DocumentPlusIcon className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold">Generate Individual Invoice</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Create a tuition invoice for a specific student based on their grade&apos;s tuition plan.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading students and plans...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Student <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Search students…"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Grades</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
              <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-white">
                {filteredStudents.length === 0 ? (
                  <p className="text-gray-600">No students found.</p>
                ) : (
                  filteredStudents.map(student => (
                    <div key={student.studentId} className="flex items-center mb-1">
                      <input
                        type="radio"
                        id={`stu-${student.studentId}`}
                        name="student"
                        value={student.studentId}
                        checked={formData.studentId === student.studentId}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          studentId: student.studentId,
                          planId: '' // Reset plan selection when student changes
                        }))}
                        className="mr-2"
                      />
                      <label htmlFor={`stu-${student.studentId}`} className="text-black cursor-pointer">
                        {student.name} (Grade {student.grade})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Tuition Plan <span className="text-red-500">*</span>
              </label>
              <select
                name="planId"
                value={formData.planId}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedStudent}
                required
              >
                <option value="">Select Tuition Plan</option>
                {availablePlans.map(plan => (
                  <option key={plan.planId} value={plan.planId}>
                    Grade {plan.grade} - ${plan.amount.toLocaleString()} ({plan.frequency})
                  </option>
                ))}
              </select>
              {selectedStudent && availablePlans.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  No active tuition plans found for Grade {selectedStudent.grade}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Billing Period Start <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="periodStart"
                value={formData.periodStart}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {formData.periodEnd && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Billing Period End
                </label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-600"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically set to last day of selected month
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateDue"
                value={formData.dateDue}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {selectedStudent && (
              <div className="space-y-3">
                {/* Parent Information Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Parent Information:</h4>
                  {loadingParents ? (
                    <div className="text-xs text-gray-600">Loading parent information...</div>
                  ) : parentRelations.length > 0 ? (
                    <div className="text-xs text-gray-800 space-y-1">
                      <div><strong>Primary Parent:</strong> {primaryParent?.parentName || 'N/A'}</div>
                      <div><strong>Relation:</strong> {primaryParent?.relation || 'N/A'}</div>
                      <div><strong>Email:</strong> {primaryParent?.parentEmail || 'N/A'}</div>
                      <div><strong>Phone:</strong> {primaryParent?.parentNumber || 'N/A'}</div>
                      {parentRelations.length > 1 && (
                        <div className="text-blue-600">+ {parentRelations.length - 1} other parent(s)</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-yellow-700">
                      No parent information found. Invoice will be created without parent details.
                    </div>
                  )}
                </div>

                {/* Invoice Preview */}
                {selectedPlan && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Invoice Preview:</h4>
                    <div className="text-xs text-blue-800 space-y-1">
                      <div>Student: {selectedStudent.name}</div>
                      <div>Grade: {selectedStudent.grade}</div>
                      <div>Amount: ${selectedPlan.amount.toLocaleString()}</div>
                      <div>Plan: {selectedPlan.frequency}</div>
                      {primaryParent && (
                        <div>Bill To: {primaryParent.parentName} ({primaryParent.relation})</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                disabled={creating || !formData.studentId || !formData.planId || !formData.periodStart || !formData.dateDue}
              >
                {creating ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default GenerateIndividualInvoiceModal