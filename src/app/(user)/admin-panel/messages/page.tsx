'use client'

// Admin oversight: every parent–teacher conversation in the school, with the
// ones waiting on a teacher the longest surfaced first. Opening a thread
// jumps into the staff inbox; posting there announces the admin joined.

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import StatTile from '@/components/ui/StatTile'
import EmptyState from '@/components/ui/EmptyState'
import { listConversations } from '@/services/messagingService'
import type { ConversationItem } from '@/services/types/messaging'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { formatListStamp } from '@/components/messaging/formatters'

type StatusFilter = 'open' | 'waiting' | 'resolved'
const WAITING_HOURS = 48

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000

const AdminMessagesPage: React.FC = () => {
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  // Loading is derived: the result carries the key it was fetched for, so a
  // filter change shows the skeleton without a setState inside the effect.
  const [result, setResult] = useState<{ key: string; items: ConversationItem[] } | null>(null)
  const [status, setStatus] = useState<StatusFilter>('open')
  const [teacher, setTeacher] = useState('')
  const [subject, setSubject] = useState('')
  const [q, setQ] = useState('')

  const fetchKey = `${status}|${selectedYearId ?? ''}`
  useEffect(() => {
    let cancelled = false
    listConversations({ status: status === 'resolved' ? 'resolved' : 'open', limit: 200 })
      .then((res) => {
        if (!cancelled) setResult({ key: fetchKey, items: res.data ?? [] })
      })
      .catch(() => !cancelled && setResult({ key: fetchKey, items: [] }))
    return () => {
      cancelled = true
    }
  }, [status, selectedYearId, fetchKey])
  const loading = result?.key !== fetchKey
  const items = useMemo(() => (result?.key === fetchKey ? result.items : []), [result, fetchKey])

  const teachers = useMemo(() => [...new Set(items.map((i) => i.leadTeacherName).filter(Boolean))].sort() as string[], [items])
  const subjects = useMemo(() => [...new Set(items.map((i) => i.classSubject))].sort(), [items])

  const waitingOnTeacher = (c: ConversationItem) =>
    c.status === 'open' && c.lastMessage?.senderRole === 'PARENT' && hoursSince(c.lastMessageAt) >= WAITING_HOURS

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items
      .filter((c) => (status === 'waiting' ? waitingOnTeacher(c) : true))
      .filter((c) => (teacher ? c.leadTeacherName === teacher : true))
      .filter((c) => (subject ? c.classSubject === subject : true))
      .filter((c) =>
        needle
          ? [c.studentName, c.title, c.classSubject, c.leadTeacherName ?? '', c.lastMessage?.senderName ?? '']
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => Number(waitingOnTeacher(b)) - Number(waitingOnTeacher(a)) || b.lastMessageAt.localeCompare(a.lastMessageAt))
  }, [items, status, teacher, subject, q])

  const waitingCount = items.filter(waitingOnTeacher).length
  const failedCount = items.filter((c) => c.emailFailed).length

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <ShieldCheckIcon className="h-7 w-7 text-cyan-600" /> All Messages
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Every parent–teacher conversation in the school. You can read and step into any thread; a line is added when you do.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label={status === 'resolved' ? 'Resolved threads' : 'Open threads'} value={items.length} loading={loading} />
            <StatTile label={`Waiting on teacher > ${WAITING_HOURS}h`} value={waitingCount} tone={waitingCount > 0 ? 'warn' : 'neutral'} loading={loading} />
            <StatTile label="Teachers in conversations" value={teachers.length} loading={loading} />
            <StatTile label="Email delivery failures" value={failedCount} tone={failedCount > 0 ? 'bad' : 'neutral'} loading={loading} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['open', 'waiting', 'resolved'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  status === s ? 'bg-cyan-50 border-cyan-200 text-cyan-800 font-medium' : 'border-slate-200 text-slate-500 hover:bg-white'
                }`}
              >
                {s === 'open' ? 'Open' : s === 'waiting' ? `Waiting > ${WAITING_HOURS}h` : 'Resolved'}
              </button>
            ))}
            <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 cursor-pointer">
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 cursor-pointer">
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="relative ml-auto block w-full sm:w-72">
              <span className="sr-only">Search</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search student, parent, teacher…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="md" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={ChatBubbleLeftRightIcon} title="No conversations match" description="Try another filter, or wait for the first parent to write in." />
            ) : (
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Conversation</th>
                    <th className="px-4 py-2.5 font-medium">Teacher</th>
                    <th className="px-4 py-2.5 font-medium">Last message</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const waiting = waitingOnTeacher(c)
                    return (
                      <tr key={c.conversationId} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {c.studentName} · {c.title}
                          </p>
                          <p className="text-xs text-slate-400">{c.classSubject}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{c.leadTeacherName ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">
                            {c.lastMessage ? `${c.lastMessage.senderRole === 'PARENT' ? 'Parent' : 'Staff'} · ${formatListStamp(c.lastMessageAt)}` : '—'}
                          </p>
                          {waiting && <p className="text-xs text-amber-700">Waiting on teacher · {Math.floor(hoursSince(c.lastMessageAt))}h</p>}
                          {!waiting && c.lastMessage?.senderRole === 'PARENT' && c.status === 'open' && <p className="text-xs text-slate-400">Waiting on teacher</p>}
                          {c.lastMessage && c.lastMessage.senderRole !== 'PARENT' && c.status === 'open' && <p className="text-xs text-slate-400">Waiting on parent</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex flex-wrap gap-1">
                            <span
                              className={`rounded-full border px-2 py-px text-[10px] font-medium ${
                                c.status === 'resolved'
                                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                                  : waiting
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {c.status === 'resolved' ? 'Resolved' : waiting ? 'Needs reply' : 'Open'}
                            </span>
                            {c.emailFailed && (
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-px text-[10px] font-medium text-rose-700">Email failed</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/messages?thread=${encodeURIComponent(c.conversationId)}`} className="text-xs font-medium text-cyan-700 hover:text-cyan-900">
                            Open
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default AdminMessagesPage
