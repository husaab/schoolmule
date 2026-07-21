'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { DocumentChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ChildSections from '@/components/parent/ChildSections'
import { childColor, childInitial } from '@/components/parent/childColors'

const ParentReportCardsPage: React.FC = () => {
  const router = useRouter()

  return (
    <ParentPageShell
      title="Report Cards"
      subtitle="View and download report cards for your children."
      badge={{ icon: DocumentChartBarIcon, label: 'Report Cards' }}
    >
      <ChildSections
        withHeaders={false}
        renderChild={(child) => {
          const color = childColor(child.studentId)
          return (
            <div
              onClick={() => router.push(`/parent/report-cards/${child.studentId}`)}
              className="group flex items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-stone-200/70 p-5 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-lg font-semibold flex-shrink-0`}
                >
                  {childInitial(child.name)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{child.name}</h3>
                  {child.grade != null && (
                    <p className="text-sm text-slate-500">Grade {child.grade}</p>
                  )}
                </div>
              </div>
              <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium group-hover:from-amber-600 group-hover:to-orange-600 transition-all flex-shrink-0">
                View Report Cards
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          )
        }}
      />
    </ParentPageShell>
  )
}

export default ParentReportCardsPage
