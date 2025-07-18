'use client'

import React, { useState } from 'react'
import Modal from '@/components/shared/modal'
import { deleteTuitionInvoice } from '@/services/tuitionInvoiceService'
import { TuitionInvoicePayload } from '@/services/types/tuitionInvoice'
import { useNotificationStore } from '@/store/useNotificationStore'
import { 
  ExclamationTriangleIcon,
  TrashIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface DeleteTuitionInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: TuitionInvoicePayload
  onDeleted: () => void
}

const DeleteTuitionInvoiceModal: React.FC<DeleteTuitionInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onDeleted
}) => {
  const showNotification = useNotificationStore(state => state.showNotification)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await deleteTuitionInvoice(invoice.invoiceId)
      
      if (response.status === 'success') {
        showNotification('Invoice deleted successfully', 'success')
        onDeleted()
        onClose()
      } else {
        showNotification(response.message || 'Failed to delete invoice', 'error')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      showNotification('Error deleting invoice', 'error')
    } finally {
      setDeleting(false)
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
      month: 'short',
      day: 'numeric'
    })
  }

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

  const isPaid = invoice.status.toLowerCase() === 'paid' || (invoice.amountPaid && invoice.amountPaid >= invoice.amountDue)

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <div className="text-black">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
          <h2 className="text-xl font-semibold text-red-600">Delete Invoice</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this tuition invoice? This action cannot be undone.
          </p>

          {isPaid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Warning</h4>
                  <p className="text-sm text-yellow-700">
                    This invoice has been paid or partially paid. Deleting it may affect your financial records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Invoice Summary
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoice ID:</span>
                <span className="font-mono text-xs">{invoice.invoiceId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Student:
                </span>
                <span className="font-medium">{invoice.studentName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Grade:</span>
                <span>Grade {invoice.studentGrade}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Billing Period:</span>
                <span>{formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  Amount Due:
                </span>
                <span className="font-semibold text-red-600">{formatCurrency(invoice.amountDue)}</span>
              </div>
              
              {invoice.amountPaid && invoice.amountPaid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span>{formatDate(invoice.dateDue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
              
              {invoice.parentName && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Parent:</span>
                  <span>{invoice.parentName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer inline-flex items-center"
            disabled={deleting}
          >
            {deleting ? (
              'Deleting...'
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteTuitionInvoiceModal