'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { generateTuitionInvoices } from '@/services/tuitionInvoiceService'
import { GenerateInvoicesRequest } from '@/services/types/tuitionInvoice'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { CalendarIcon, UserGroupIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'

interface GenerateInvoicesModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerated: () => void
}

const GenerateInvoicesModal: React.FC<GenerateInvoicesModalProps> = ({
  isOpen,
  onClose,
  onGenerated
}) => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)

  const [formData, setFormData] = useState({
    grade: '',
    billingMonth: '',
    dueDate: ''
  })
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<{
    invoicesCreated: number;
    invoicesSkipped: number;
    totalStudents: number;
    errors?: string[];
  } | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGenerate = async () => {
    if (!formData.billingMonth || !formData.dueDate) {
      showNotification('Please fill in billing month and due date', 'error')
      return
    }

    setGenerating(true)
    setResults(null)

    try {
      const payload: GenerateInvoicesRequest = {
        school: user.school!,
        grade: formData.grade || undefined,
        billingMonth: formData.billingMonth,
        dueDate: formData.dueDate
      }

      const response = await generateTuitionInvoices(payload)
      
      if (response.status === 'success') {
        setResults(response.data)
        showNotification(
          `Generated ${response.data.invoicesCreated} invoices successfully`,
          'success'
        )
        onGenerated()
      } else {
        showNotification(response.message || 'Failed to generate invoices', 'error')
      }
    } catch (error) {
      console.error('Error generating invoices:', error)
      showNotification('Error generating invoices', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleClose = () => {
    setResults(null)
    setFormData({ grade: '', billingMonth: '', dueDate: '' })
    onClose()
  }

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8']

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style="p-6 max-w-lg w-11/12">
      <div className="text-black">
        <div className="flex items-center mb-4">
          <DocumentPlusIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold">Generate Monthly Invoices</h2>
        </div>

        {!results ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Create tuition invoices for students based on their grade&apos;s monthly tuition plan.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">
                <UserGroupIcon className="h-4 w-4 inline mr-1" />
                Grade Selection
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Billing Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                name="billingMonth"
                value={formData.billingMonth}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">What will happen:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Find all students in {formData.grade ? `Grade ${formData.grade}` : 'all grades'}</li>
                <li>• Look up their monthly tuition plans</li>
                <li>• Create invoices for the selected billing month</li>
                <li>• Skip students who already have invoices for this period</li>
                <li>• Set due date to {formData.dueDate || '[selected date]'}</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Invoices'}
              </button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <DocumentPlusIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Invoices Generated Successfully!
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoices Created:</span>
                <span className="font-semibold text-green-600">{results.invoicesCreated}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoices Skipped:</span>
                <span className="font-semibold text-yellow-600">{results.invoicesSkipped}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Students:</span>
                <span className="font-semibold">{results.totalStudents}</span>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-900 mb-2">Errors:</h4>
                <ul className="text-xs text-red-800 space-y-1">
                  {results.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default GenerateInvoicesModal