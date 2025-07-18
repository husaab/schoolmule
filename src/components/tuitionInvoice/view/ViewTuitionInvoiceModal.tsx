'use client'

import React from 'react'
import Modal from '@/components/shared/modal'
import { TuitionInvoicePayload } from '@/services/types/tuitionInvoice'
import { 
  DocumentTextIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

interface ViewTuitionInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: TuitionInvoicePayload
}

const ViewTuitionInvoiceModal: React.FC<ViewTuitionInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-2xl w-11/12">
      <div className="text-black">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Invoice Details</h2>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>

        <div className="space-y-6">
          {/* Invoice Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
              Invoice Information
            </h3>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">School</label>
                <p className="text-sm bg-white px-3 py-2 rounded border">{invoice.school}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Created At</label>
                <p className="text-sm bg-white px-3 py-2 rounded border">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Student Name</label>
                <p className="text-sm bg-white px-3 py-2 rounded border">{invoice.studentName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Grade</label>
                <p className="text-sm bg-white px-3 py-2 rounded border flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1 text-gray-600" />
                  Grade {invoice.studentGrade}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Student ID</label>
                <p className="text-sm font-mono bg-white px-3 py-2 rounded border">{invoice.studentId}</p>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          {(invoice.parentName || invoice.parentEmail || invoice.parentNumber) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-green-600" />
                Parent Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.parentName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Parent Name</label>
                    <p className="text-sm bg-white px-3 py-2 rounded border">{invoice.parentName}</p>
                  </div>
                )}
                {invoice.parentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Parent ID</label>
                    <p className="text-sm font-mono bg-white px-3 py-2 rounded border">{invoice.parentId}</p>
                  </div>
                )}
                {invoice.parentEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-sm bg-white px-3 py-2 rounded border flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-600" />
                      {invoice.parentEmail}
                    </p>
                  </div>
                )}
                {invoice.parentNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <p className="text-sm bg-white px-3 py-2 rounded border flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-600" />
                      {invoice.parentNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Billing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Billing Period</label>
                <p className="text-sm bg-white px-3 py-2 rounded border">
                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                <p className="text-sm bg-white px-3 py-2 rounded border flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-600" />
                  {formatDate(invoice.dateDue)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Amount Due</label>
                <p className="text-lg font-semibold bg-white px-3 py-2 rounded border text-red-600">
                  {formatCurrency(invoice.amountDue)}
                </p>
              </div>
              {invoice.issuedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Issued Date</label>
                  <p className="text-sm bg-white px-3 py-2 rounded border">
                    {formatDate(invoice.issuedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {(invoice.amountPaid || invoice.datePaid) && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-purple-600" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.amountPaid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount Paid</label>
                    <p className="text-lg font-semibold bg-white px-3 py-2 rounded border text-green-600">
                      {formatCurrency(invoice.amountPaid)}
                    </p>
                  </div>
                )}
                {invoice.datePaid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Payment Date</label>
                    <p className="text-sm bg-white px-3 py-2 rounded border">
                      {formatDate(invoice.datePaid)}
                    </p>
                  </div>
                )}
                {invoice.amountPaid && invoice.amountDue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Remaining Balance</label>
                    <p className={`text-lg font-semibold bg-white px-3 py-2 rounded border ${
                      invoice.amountDue - invoice.amountPaid <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(invoice.amountDue - invoice.amountPaid)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4 text-gray-600">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoice.lastModifiedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Last Modified</label>
                  <p className="text-sm bg-white px-3 py-2 rounded border">
                    {formatDate(invoice.lastModifiedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ViewTuitionInvoiceModal