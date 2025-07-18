'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { updateTuitionInvoice } from '@/services/tuitionInvoiceService'
import { TuitionInvoicePayload } from '@/services/types/tuitionInvoice'
import { useNotificationStore } from '@/store/useNotificationStore'
import { 
  DocumentTextIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

interface EditTuitionInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: TuitionInvoicePayload
  onUpdated: () => void
}

const EditTuitionInvoiceModal: React.FC<EditTuitionInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onUpdated
}) => {
  const showNotification = useNotificationStore(state => state.showNotification)
  const [updating, setUpdating] = useState(false)

  const [formData, setFormData] = useState({
    studentName: '',
    studentGrade: '',
    parentName: '',
    parentEmail: '',
    parentNumber: '',
    periodStart: '',
    periodEnd: '',
    amountDue: 0,
    dateDue: '',
    amountPaid: 0,
    datePaid: '',
    issuedAt: '',
    status: 'pending'
  })

  // Initialize form data when invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData({
        studentName: invoice.studentName || '',
        studentGrade: invoice.studentGrade || '',
        parentName: invoice.parentName || '',
        parentEmail: invoice.parentEmail || '',
        parentNumber: invoice.parentNumber || '',
        periodStart: invoice.periodStart ? invoice.periodStart.split('T')[0] : '',
        periodEnd: invoice.periodEnd ? invoice.periodEnd.split('T')[0] : '',
        amountDue: invoice.amountDue || 0,
        dateDue: invoice.dateDue ? invoice.dateDue.split('T')[0] : '',
        amountPaid: invoice.amountPaid || 0,
        datePaid: invoice.datePaid ? invoice.datePaid.split('T')[0] : '',
        issuedAt: invoice.issuedAt ? invoice.issuedAt.split('T')[0] : '',
        status: invoice.status || 'pending'
      })
    }
  }, [invoice])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'number' ? parseFloat(value) || 0 : value
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      }
      
      // Auto-set status to "paid" if amount paid equals or exceeds amount due
      if (name === 'amountPaid' || name === 'amountDue') {
        const amountPaid = name === 'amountPaid' ? newValue as number : prev.amountPaid
        const amountDue = name === 'amountDue' ? newValue as number : prev.amountDue
        
        if (amountPaid >= amountDue && amountDue > 0) {
          updated.status = 'paid'
        } else if (prev.status === 'paid' && amountPaid < amountDue) {
          // If status was "paid" but payment is now less than due, set to pending
          updated.status = 'pending'
        }
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.studentName || !formData.amountDue || !formData.dateDue) {
      showNotification('Please fill in required fields', 'error')
      return
    }

    setUpdating(true)

    try {
      const payload = {
        studentName: formData.studentName,
        studentGrade: formData.studentGrade || undefined,
        parentName: formData.parentName || undefined,
        parentEmail: formData.parentEmail || undefined,
        parentNumber: formData.parentNumber || undefined,
        periodStart: formData.periodStart || undefined,
        periodEnd: formData.periodEnd || undefined,
        amountDue: formData.amountDue,
        dateDue: formData.dateDue,
        amountPaid: formData.amountPaid || undefined,
        datePaid: formData.datePaid || undefined,
        issuedAt: formData.issuedAt || undefined,
        status: formData.status
      }

      const response = await updateTuitionInvoice(invoice.invoiceId, payload)
      
      if (response.status === 'success') {
        showNotification('Invoice updated successfully', 'success')
        onUpdated()
        onClose()
      } else {
        showNotification(response.message || 'Failed to update invoice', 'error')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      showNotification('Error updating invoice', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8']

  // Check if payment is complete (automatically sets status to "paid")
  const isFullyPaid = formData.amountPaid >= formData.amountDue && formData.amountDue > 0
  const isStatusDisabled = isFullyPaid

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-4xl w-11/12 max-h-[90vh] overflow-y-auto">
      <div className="text-black">
        <div className="flex items-center mb-6">
          <DocumentTextIcon className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold">Edit Invoice</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                  Grade
                </label>
                <select
                  name="studentGrade"
                  value={formData.studentGrade}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-green-600" />
              Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Parent Name</label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Parent Email
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">
                  <PhoneIcon className="h-4 w-4 inline mr-1" />
                  Parent Phone
                </label>
                <input
                  type="text"
                  name="parentNumber"
                  value={formData.parentNumber}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Billing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="periodStart"
                  value={formData.periodStart}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Period End <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="periodEnd"
                  value={formData.periodEnd}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount Due <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    name="amountDue"
                    value={formData.amountDue}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full border rounded px-8 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateDue"
                  value={formData.dateDue}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Issued Date</label>
                <input
                  type="date"
                  name="issuedAt"
                  value={formData.issuedAt}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Status
                  {isStatusDisabled && (
                    <span className="text-xs text-green-600 ml-2">(Auto-set to Paid)</span>
                  )}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isStatusDisabled}
                  className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                    isStatusDisabled ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                  }`}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isStatusDisabled && (
                  <p className="text-xs text-green-600 mt-1">
                    Status automatically set to "Paid" because payment amount equals or exceeds amount due.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-purple-600" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    name="amountPaid"
                    value={formData.amountPaid}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max={formData.amountDue}
                    className="w-full border rounded px-8 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Date</label>
                <input
                  type="date"
                  name="datePaid"
                  value={formData.datePaid}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            {/* Balance Summary */}
            {formData.amountDue > 0 && (
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Amount Due:</span>
                    <p className="text-lg font-semibold text-red-600">
                      ${formData.amountDue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Amount Paid:</span>
                    <p className="text-lg font-semibold text-green-600">
                      ${formData.amountPaid.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Remaining Balance:</span>
                    <p className={`text-lg font-semibold ${
                      formData.amountDue - formData.amountPaid <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(formData.amountDue - formData.amountPaid).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Information (Read-only) */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-gray-600">System Information (Read-only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Invoice ID</label>
                <p className="text-sm font-mono bg-white px-3 py-2 rounded border">{invoice.invoiceId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Plan ID</label>
                <p className="text-sm font-mono bg-white px-3 py-2 rounded border">{invoice.planId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Student ID</label>
                <p className="text-sm font-mono bg-white px-3 py-2 rounded border">{invoice.studentId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">School</label>
                <p className="text-sm bg-white px-3 py-2 rounded border">{invoice.school}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default EditTuitionInvoiceModal