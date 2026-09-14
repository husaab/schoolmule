'use client'

// Daily attendance rate over the last 7/14/30 school days, with the 90%
// line schools try to stay above. Week and month rates sit in the footer so
// the chart card carries every attendance figure instead of a separate row
// of tiles doing it.

import React from 'react'
import Link from 'next/link'
import { ArrowRightIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import type { AttendanceTrendPoint } from '@/services/types/dashboard'
import { attendanceHref } from './dashboardPaths'

interface AttendanceCardProps {
  trend: AttendanceTrendPoint[]
  daysWindow: number
  onWindowChange: (days: number) => void
  weekly: number | null | undefined
  monthly: number | null | undefined
  /** yyyy-MM-dd, for the deep link. */
  today: string
}

const pct = (v: number | null | undefined) => (typeof v === 'number' && v > 0 ? `${(v * 100).toFixed(1)}%` : '—')

const AttendanceCard: React.FC<AttendanceCardProps> = ({ trend, daysWindow, onWindowChange, weekly, monthly, today }) => {
  const hasData = trend.some((t) => t.rate > 0)

  return (
    <Card>
      <SectionHeader
        title="Attendance"
        hint="Share of students present each day"
        action={
          <div className="flex items-center gap-3">
            <select
              value={daysWindow}
              onChange={(e) => onWindowChange(Number(e.target.value))}
              aria-label="Attendance window"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              {[7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  Last {d} days
                </option>
              ))}
            </select>
            <Link
              href={attendanceHref(today)}
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              Attendance
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={ClipboardDocumentCheckIcon}
          iconClassName="text-cyan-400"
          title="No attendance recorded yet"
          description="Take today's attendance and the daily rate starts charting here."
          action={
            <Link
              href={attendanceHref(today)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition"
            >
              Take attendance
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={trend} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(new Date(d), 'MM/dd')}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelFormatter={(label) => format(new Date(label), 'EEEE, MMM do')}
                formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Present']}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                itemStyle={{ color: '#0891b2' }}
              />
              {/* The line schools are trying to stay above. */}
              <ReferenceLine
                y={0.9}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: '90% target', position: 'right', fill: '#b45309', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#0891b2"
                strokeWidth={2.5}
                fill="url(#attendanceFill)"
                dot={{ r: 3.5, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 tabular-nums">
        <span>
          <span className="font-semibold text-slate-700">{pct(weekly)}</span> this week
        </span>
        <span>
          <span className="font-semibold text-slate-700">{pct(monthly)}</span> this month
        </span>
      </div>
    </Card>
  )
}

export default AttendanceCard
