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
        <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="flex justify-center py-20">
            <Spinner />
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
        <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="text-center text-red-600 py-20">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Financial Data</h3>
            <p className="text-sm text-red-600">{error}</p>
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
        <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
          <div className="text-center text-gray-500 py-20">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Available</h3>
            <p className="text-sm text-gray-500">No tuition data found for your school.</p>
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
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="text-black text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold">Financial Overview</h1>
          <p className="text-gray-600 mt-2">Comprehensive financial insights and revenue analytics for your school.</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(financialData.totalRevenue)}</p>
              </div>
            </div>
          </div>

          {/* Outstanding Amount */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(financialData.totalOutstanding)}</p>
              </div>
            </div>
          </div>

          {/* Students with Invoices */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Students with Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">{financialData.studentsWithInvoices}</p>
              </div>
            </div>
          </div>

          {/* Average Payment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Payment</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(financialData.averagePayment)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Status Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Status Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(financialData.statusCounts).map(([status, count]) => {
                const Icon = statusIcons[status as keyof typeof statusIcons]
                const colorClass = statusColors[status as keyof typeof statusColors]
                
                return (
                  <div key={status} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 capitalize">{status}</p>
                      </div>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly Revenue Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Revenue Trends</h3>
            {financialData.monthlyTrends.length > 0 ? (
              <div className="space-y-3">
                {financialData.monthlyTrends.slice(-6).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatMonth(trend.month)}</p>
                      <p className="text-xs text-gray-500">{trend.invoiceCount} invoices</p>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(trend.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No revenue data available yet.</p>
                <p className="text-xs text-gray-400 mt-1">Revenue trends will appear here once invoices are generated.</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Summary Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{financialData.statusCounts.paid}</p>
              <p className="text-sm text-gray-600">Paid Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{financialData.statusCounts.pending}</p>
              <p className="text-sm text-gray-600">Pending Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{financialData.statusCounts.overdue}</p>
              <p className="text-sm text-gray-600">Overdue Invoices</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default FinancialOverviewPage