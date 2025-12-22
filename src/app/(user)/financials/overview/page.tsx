'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { getFinancialOverview } from '@/services/dashboardService'
import { FinancialOverviewData } from '@/services/types/dashboard'
import Spinner from '@/components/Spinner'
import { CurrencyDollarIcon, UserGroupIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

const FinancialOverviewPage: React.FC = () => {
  const user = useUserStore(state => state.user)
  const [financialData, setFinancialData] = useState<FinancialOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFinancialData = useCallback(async () => {
    if (!user.school) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await getFinancialOverview(user.school)
      if (response.status === 'success') {
        setFinancialData(response.data)
      } else {
        setError('Failed to load financial data')
      }
    } catch (err) {
      console.error('Error loading financial data:', err)
      setError('Error loading financial data')
    } finally {
      setLoading(false)
    }
  }, [user.school])

  useEffect(() => {
    loadFinancialData()
  }, [user.school, loadFinancialData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatMonth = (monthString: string) => {
    return new Date(monthString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Financial Data</h3>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!financialData) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Financial Data Available</h3>
              <p className="text-sm text-slate-500">No tuition data found for your school.</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  const statusIcons = {
    paid: CheckCircleIcon,
    pending: ClockIcon,
    overdue: ExclamationTriangleIcon,
    cancelled: XCircleIcon
  }

  const statusColors = {
    paid: 'text-green-600 bg-green-100',
    pending: 'text-yellow-600 bg-yellow-100',
    overdue: 'text-red-600 bg-red-100',
    cancelled: 'text-gray-600 bg-gray-100'
  }

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
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Financial Overview</h1>
                <p className="text-slate-500 mt-1">Comprehensive financial insights and revenue analytics</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Financial Dashboard</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(financialData.totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Outstanding Amount */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Outstanding</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(financialData.totalOutstanding)}</p>
                </div>
              </div>
            </div>

            {/* Students with Invoices */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Students with Invoices</p>
                  <p className="text-2xl font-bold text-slate-900">{financialData.studentsWithInvoices}</p>
                </div>
              </div>
            </div>

            {/* Average Payment */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Average Payment</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(financialData.averagePayment)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Invoice Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Invoice Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(financialData.statusCounts).map(([status, count]) => {
                  const Icon = statusIcons[status as keyof typeof statusIcons]
                  const colorClass = statusColors[status as keyof typeof statusColors]

                  return (
                    <div key={status} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 capitalize">{status}</p>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly Revenue Trends */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Monthly Revenue Trends</h3>
              {financialData.monthlyTrends.length > 0 ? (
                <div className="space-y-3">
                  {financialData.monthlyTrends.slice(-6).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{formatMonth(trend.month)}</p>
                        <p className="text-xs text-slate-500">{trend.invoiceCount} invoices</p>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        {formatCurrency(trend.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600">No revenue data available yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Revenue trends will appear here once invoices are generated.</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <p className="text-4xl font-bold text-emerald-600">{financialData.statusCounts.paid}</p>
                <p className="text-sm text-slate-600 mt-2">Paid Invoices</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                <p className="text-4xl font-bold text-amber-600">{financialData.statusCounts.pending}</p>
                <p className="text-sm text-slate-600 mt-2">Pending Invoices</p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                <p className="text-4xl font-bold text-red-600">{financialData.statusCounts.overdue}</p>
                <p className="text-sm text-slate-600 mt-2">Overdue Invoices</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default FinancialOverviewPage