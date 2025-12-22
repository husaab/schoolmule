'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getTuitionPlansBySchool } from '@/services/tuitionPlanService'
import { TuitionPlanPayload } from '@/services/types/tuitionPlan'
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, PencilIcon, TrashIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useNotificationStore } from '@/store/useNotificationStore'
import AddTuitionPlanModal from '@/components/tuitionPlan/add/AddTuitionPlanModal'
import EditTuitionPlanModal from '@/components/tuitionPlan/edit/EditTuitionPlanModal'
import DeleteTuitionPlanModal from '@/components/tuitionPlan/delete/DeleteTuitionPlanModal'
import GenerateInvoicesModal from '@/components/tuitionInvoice/generate/GenerateInvoicesModal'
import GenerateIndividualInvoiceModal from '@/components/tuitionInvoice/generateIndividual/GenerateIndividualInvoiceModal'
import ViewTuitionInvoiceModal from '@/components/tuitionInvoice/view/ViewTuitionInvoiceModal'
import EditTuitionInvoiceModal from '@/components/tuitionInvoice/edit/EditTuitionInvoiceModal'
import DeleteTuitionInvoiceModal from '@/components/tuitionInvoice/delete/DeleteTuitionInvoiceModal'
import TuitionInvoiceCommentsModal from '@/components/tuitionInvoice/comments/TuitionInvoiceCommentsModal'
import { getTuitionInvoicesBySchool, updateTuitionInvoice } from '@/services/tuitionInvoiceService'
import { getTuitionInvoiceCommentsBySchool } from '@/services/tuitionInvoiceCommentService'
import { TuitionInvoicePayload } from '@/services/types/tuitionInvoice'

const TuitionPage: React.FC = () => {
  const user = useUserStore(state => state.user)
  const showNotification = useNotificationStore(state => state.showNotification)
  
  // Tuition Plan State
  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlanPayload[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [plansExpanded, setPlansExpanded] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<string>('')

  // Tuition Invoice State
  const [tuitionInvoices, setTuitionInvoices] = useState<TuitionInvoicePayload[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedInvoiceGrade, setSelectedInvoiceGrade] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState<TuitionPlanPayload | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState<TuitionPlanPayload | null>(null)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generateIndividualModalOpen, setGenerateIndividualModalOpen] = useState(false)
  const [viewInvoiceModalOpen, setViewInvoiceModalOpen] = useState<TuitionInvoicePayload | null>(null)
  const [editInvoiceModalOpen, setEditInvoiceModalOpen] = useState<TuitionInvoicePayload | null>(null)
  const [deleteInvoiceModalOpen, setDeleteInvoiceModalOpen] = useState<TuitionInvoicePayload | null>(null)
  const [commentsModalOpen, setCommentsModalOpen] = useState<TuitionInvoicePayload | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

   // Load comment counts efficiently with single API call
  const loadCommentCounts = useCallback(async () => {
    try {
      const response = await getTuitionInvoiceCommentsBySchool(user.school!)
      if (response.status === 'success') {
        // Group comments by invoice ID and count them
        const counts: Record<string, number> = {}
        response.data.forEach(comment => {
          counts[comment.invoiceId] = (counts[comment.invoiceId] || 0) + 1
        })
        setCommentCounts(counts)
      }
    } catch (error) {
      console.error('Error loading comment counts:', error)
      // Set empty counts if error
      setCommentCounts({})
    }
  }, [user.school])

  // Load tuition plans
  const loadTuitionPlans = useCallback(async () => {
    if (!user.school) return
    
    setPlansLoading(true)
    setPlansError(null)
    
    try {
      const response = await getTuitionPlansBySchool(user.school)
      if (response.status === 'success') {
        setTuitionPlans(response.data)
      } else {
        setPlansError(response.message || 'Failed to load tuition plans')
      }
    } catch (err) {
      console.error('Error loading tuition plans:', err)
      setPlansError('Error loading tuition plans')
    } finally {
      setPlansLoading(false)
    }
  }, [user.school])

  // Load tuition invoices
  const loadTuitionInvoices = useCallback(async () => {
    if (!user.school) return
    
    setInvoicesLoading(true)
    setInvoicesError(null)
    
    try {
      const response = await getTuitionInvoicesBySchool(user.school)
      if (response.status === 'success') {
        setTuitionInvoices(response.data)
        // Load comment counts efficiently with single API call
        loadCommentCounts()
      } else {
        setInvoicesError(response.message || 'Failed to load tuition invoices')
      }
    } catch (err) {
      console.error('Error loading tuition invoices:', err)
      setInvoicesError('Error loading tuition invoices')
    } finally {
      setInvoicesLoading(false)
    }
  }, [user.school, loadCommentCounts])

  // Update comment count for a specific invoice
  const updateCommentCount = (invoiceId: string, newCount: number) => {
    setCommentCounts(prev => ({
      ...prev,
      [invoiceId]: newCount
    }))
  }

  // Handle status change for inline editing
  const handleStatusChange = async (invoice: TuitionInvoicePayload, newStatus: string) => {
    // Prevent updating if already updating
    if (updatingStatus === invoice.invoiceId) return

    setUpdatingStatus(invoice.invoiceId)

    try {
      const updatedInvoice = {
        ...invoice,
        status: newStatus as 'pending' | 'paid' | 'overdue' | 'cancelled'
      }

      const response = await updateTuitionInvoice(invoice.invoiceId, updatedInvoice)
      
      if (response.status === 'success') {
        // Update the invoice in the local state
        setTuitionInvoices(prev => 
          prev.map(inv => 
            inv.invoiceId === invoice.invoiceId 
              ? { ...inv, status: newStatus }
              : inv
          )
        )
        showNotification(`Invoice status updated to ${newStatus}`, 'success')
      } else {
        console.error('Failed to update invoice status:', response.message)
        showNotification('Failed to update invoice status', 'error')
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
      showNotification('Error updating invoice status', 'error')
    } finally {
      setUpdatingStatus(null)
    }
  }

  useEffect(() => {
    loadTuitionPlans()
    loadTuitionInvoices()
  }, [user.school, loadTuitionPlans, loadTuitionInvoices])

  // Filter plans by grade
  const filteredPlans = selectedGrade 
    ? tuitionPlans.filter(plan => plan.grade === selectedGrade)
    : tuitionPlans

  // Filter invoices by month, grade, and status
  const filteredInvoices = tuitionInvoices.filter(invoice => {
    const matchesMonth = selectedMonth ? invoice.periodStart.startsWith(selectedMonth) : true
    const matchesGrade = selectedInvoiceGrade ? invoice.studentGrade === selectedInvoiceGrade : true
    const matchesStatus = selectedStatus ? invoice.status === selectedStatus : true
    return matchesMonth && matchesGrade && matchesStatus
  })

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8']
  const invoiceStatuses = ['pending', 'paid', 'overdue', 'cancelled']

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Tuition Management</h1>
                <p className="text-slate-500 mt-1">Manage tuition plans and billing for your school</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
                <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">Tuition Dashboard</span>
              </div>
            </div>
          </div>

        {/* Tuition Plans Section - Collapsible */}
        <div className="bg-white rounded-2xl shadow-md mb-8">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setPlansExpanded(!plansExpanded)}
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Tuition Plans</h2>
              <p className="text-sm text-gray-600">Manage pricing plans by grade level</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {tuitionPlans.length} plan{tuitionPlans.length !== 1 ? 's' : ''}
              </span>
              {plansExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>

          {plansExpanded && (
            <div className="border-t px-6 pb-6">
              {/* Controls Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pt-6">
                {/* Add Plan Button */}
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Tuition Plan
                </button>

                {/* Grade Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 text-black">Filter by Grade:</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="">All Grades</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Plans Content */}
              {plansLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : plansError ? (
                <div className="text-center text-red-600 py-8">
                  {plansError}
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedGrade ? `No tuition plans for Grade ${selectedGrade}` : 'No Tuition Plans'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedGrade ? 'Try selecting a different grade or create a new plan.' : 'Create your first tuition plan to get started.'}
                  </p>
                </div>
              ) : (
                /* Plans Table */
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Frequency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Effective Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPlans.map((plan) => (
                        <tr key={plan.planId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Grade {plan.grade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${plan.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {plan.frequency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(plan.effectiveFrom).toLocaleDateString()}
                            {plan.effectiveTo && (
                              <> - {new Date(plan.effectiveTo).toLocaleDateString()}</>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditModalOpen(plan)}
                                className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                                title="Edit Plan"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setDeleteModalOpen(plan)}
                                className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                                title="Delete Plan"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tuition Invoices Section */}
        <div className="bg-white rounded-2xl shadow-md">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Tuition Invoices</h2>
                <p className="text-sm text-gray-600">Manage student billing and payments</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setGenerateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Generate Invoices
                </button>
                <button
                  onClick={() => setGenerateIndividualModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <UserIcon className="h-5 w-5 mr-2" />
                  Individual Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Grade
                </label>
                <select
                  value={selectedInvoiceGrade}
                  onChange={(e) => setSelectedInvoiceGrade(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="">All Grades</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="">All Statuses</option>
                  {invoiceStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(selectedMonth || selectedInvoiceGrade || selectedStatus) && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Showing {filteredInvoices.length} of {tuitionInvoices.length} invoices
                </span>
                <button
                  onClick={() => {
                    setSelectedMonth('')
                    setSelectedInvoiceGrade('')
                    setSelectedStatus('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Invoices Content */}
          <div className="p-6">
            {invoicesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : invoicesError ? (
              <div className="text-center text-red-600 py-8">
                {invoicesError}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {tuitionInvoices.length === 0 ? 'No Invoices' : 'No Matching Invoices'}
                </h3>
                <p className="text-sm text-gray-500">
                  {tuitionInvoices.length === 0 
                    ? 'Generate your first invoices to get started.' 
                    : 'Try adjusting your filters or generate new invoices.'}
                </p>
              </div>
            ) : (
              /* Invoices Table */
              <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Billing Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.invoiceId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.studentName}
                          </div>
                          {invoice.parentName && (
                            <div className="text-sm text-gray-500">
                              Parent: {invoice.parentName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Grade {invoice.studentGrade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${invoice.amountDue.toLocaleString()}
                          {invoice.amountPaid && invoice.amountPaid > 0 && (
                            <div className="text-xs text-green-600">
                              Paid: ${invoice.amountPaid.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.dateDue).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={invoice.status}
                            onChange={(e) => handleStatusChange(invoice, e.target.value)}
                            disabled={updatingStatus === invoice.invoiceId}
                            className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : invoice.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            } ${updatingStatus === invoice.invoiceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {invoiceStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => setCommentsModalOpen(invoice)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900 cursor-pointer"
                            title="View Comments"
                          >
                            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {commentCounts[invoice.invoiceId] || 0}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewInvoiceModalOpen(invoice)}
                              className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                              title="View Invoice"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditInvoiceModalOpen(invoice)}
                              className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                              title="Edit Invoice"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setDeleteInvoiceModalOpen(invoice)}
                              className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                              title="Delete Invoice"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {addModalOpen && (
          <AddTuitionPlanModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdded={loadTuitionPlans}
          />
        )}

        {editModalOpen && (
          <EditTuitionPlanModal
            isOpen={!!editModalOpen}
            onClose={() => setEditModalOpen(null)}
            plan={editModalOpen}
            onUpdated={loadTuitionPlans}
          />
        )}

        {deleteModalOpen && (
          <DeleteTuitionPlanModal
            isOpen={!!deleteModalOpen}
            onClose={() => setDeleteModalOpen(null)}
            plan={deleteModalOpen}
            onDeleted={loadTuitionPlans}
          />
        )}

        {generateModalOpen && (
          <GenerateInvoicesModal
            isOpen={generateModalOpen}
            onClose={() => setGenerateModalOpen(false)}
            onGenerated={loadTuitionInvoices}
          />
        )}

        {generateIndividualModalOpen && (
          <GenerateIndividualInvoiceModal
            isOpen={generateIndividualModalOpen}
            onClose={() => setGenerateIndividualModalOpen(false)}
            onGenerated={loadTuitionInvoices}
          />
        )}

        {viewInvoiceModalOpen && (
          <ViewTuitionInvoiceModal
            isOpen={!!viewInvoiceModalOpen}
            onClose={() => setViewInvoiceModalOpen(null)}
            invoice={viewInvoiceModalOpen}
          />
        )}

        {editInvoiceModalOpen && (
          <EditTuitionInvoiceModal
            isOpen={!!editInvoiceModalOpen}
            onClose={() => setEditInvoiceModalOpen(null)}
            invoice={editInvoiceModalOpen}
            onUpdated={loadTuitionInvoices}
          />
        )}

        {deleteInvoiceModalOpen && (
          <DeleteTuitionInvoiceModal
            isOpen={!!deleteInvoiceModalOpen}
            onClose={() => setDeleteInvoiceModalOpen(null)}
            invoice={deleteInvoiceModalOpen}
            onDeleted={loadTuitionInvoices}
          />
        )}

        {commentsModalOpen && (
          <TuitionInvoiceCommentsModal
            isOpen={!!commentsModalOpen}
            onClose={() => setCommentsModalOpen(null)}
            invoice={commentsModalOpen}
            commentCount={commentCounts[commentsModalOpen.invoiceId] || 0}
            onCommentCountChange={(newCount) => updateCommentCount(commentsModalOpen.invoiceId, newCount)}
          />
        )}
        </div>
      </main>
    </>
  )
}

export default TuitionPage