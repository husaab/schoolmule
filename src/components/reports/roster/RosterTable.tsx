// src/components/reports/roster/RosterTable.tsx
// The term's students, one row each: their report (or that there isn't one
// yet) and where the family email stands, with the next step for that row
// right there (Generate, View, Email family). Report cards add whose teacher
// comments are in (`comments`). A student waiting to be generated
// (`waiting`) shows Queued or Generating… instead, with no Generate, email or
// delete until their report is made; their current PDF can still be viewed
// and downloaded. A table from md up, a card per student on a phone. The
// header row stays under the navbar while scrolling.
'use client'

import { useEffect, useRef } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  DocumentPlusIcon,
  EnvelopeIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import StudentNameLink from '@/components/student/profile/StudentNameLink'
import { commentsLine, commentsMissing, emailedLine, gradeLabel, missingSubjects, reportLine, type CommentsStatus, type RosterRow } from '@/lib/reportRoster'
import type { WaitingState } from '@/lib/reportGeneration'
import type { StudentPayload } from '@/services/types/student'
import RosterRowMenu, { type RowMenuItem } from './RosterRowMenu'
import type { ReportDoc } from '../reportDocs'

export type Row = RosterRow<StudentPayload>

export interface RowActions {
  view: (row: Row) => void
  download: (row: Row) => void
  emailFamily: (row: Row) => void
  emailDetails: (row: Row) => void
  generate: (studentIds: string[]) => void
  remove: (row: Row) => void
}

interface Props {
  doc: ReportDoc
  rows: Row[]
  selectedIds: string[]
  onToggle: (studentId: string) => void
  onToggleAll: () => void
  actions: RowActions
  /** The row whose PDF link is being fetched for View. */
  openingId?: string | null
  /** Whose teacher comments are in, by student id (report cards); no column when omitted. */
  comments?: Map<string, CommentsStatus>
  /** Students waiting to be generated, by id. */
  waiting?: Map<string, WaitingState>
}

const smallButton =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-wait disabled:opacity-60'
const plainButton = `${smallButton} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
const tintButton = `${smallButton} border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100`
const generateButton = `${smallButton} border-slate-200 bg-white text-cyan-800 hover:bg-slate-50`

const checkboxClass = 'h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500'

function Name({ row }: { row: Row }) {
  return row.student ? (
    <StudentNameLink studentId={row.studentId} className="truncate font-medium text-slate-900 hover:text-cyan-700 hover:underline">
      {row.name}
    </StudentNameLink>
  ) : (
    <span className="truncate font-medium text-slate-900" title="This student is no longer on the list">
      {row.name}
    </span>
  )
}

function ReportStatus({ row }: { row: Row }) {
  return (
    <span className={`inline-flex items-center gap-2 ${row.report ? 'text-cyan-800' : 'text-slate-500'}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${row.report ? 'bg-cyan-500' : 'bg-slate-300'}`} aria-hidden="true" />
      {reportLine(row)}
    </span>
  )
}

function EmailStatus({ row, actions, waiting }: { row: Row; actions: RowActions; waiting?: WaitingState }) {
  if (row.status === 'none') return <span className="text-slate-300">—</span>
  // An email now would attach the PDF being replaced.
  if (waiting) {
    return row.status === 'ready' ? (
      <span className="text-[13px] text-slate-400">After the new version</span>
    ) : (
      <span className={`inline-flex items-center gap-1.5 text-[13px] ${row.status === 'updated' ? 'text-amber-800' : 'text-teal-800'}`}>
        <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {emailedLine(row)}
      </span>
    )
  }
  if (row.status === 'ready') {
    return (
      <button type="button" onClick={() => actions.emailFamily(row)} className={tintButton}>
        <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
        Email family
      </button>
    )
  }
  const updated = row.status === 'updated'
  return (
    <button
      type="button"
      onClick={() => actions.emailDetails(row)}
      title="See what was sent"
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
        updated ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
      }`}
    >
      {updated ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" /> : <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />}
      {emailedLine(row)}
    </button>
  )
}

/** "All 8 in", or "6 of 8 classes" over the classes still missing (teachers on hover). */
function CommentsCell({ row, status, prefix = '' }: { row: Row; status: CommentsStatus | undefined; prefix?: string }) {
  if (!status || status.total === 0) {
    const kindergarten = row.grade === 'JK' || row.grade === 'SK'
    return (
      <span className="text-slate-300" title={kindergarten ? 'JK and SK report cards have no class comments' : 'Not in a class this term'}>
        —
      </span>
    )
  }
  if (!commentsMissing(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-teal-800">
        <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {prefix}
        {commentsLine(status)}
      </span>
    )
  }
  const who = status.missing.map((m) => (m.teacherName ? `${m.subject} (${m.teacherName})` : m.subject)).join(', ')
  return (
    <span className="block min-w-0" title={`Missing: ${who}`}>
      <span className="inline-flex items-center gap-2 text-amber-800">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
        {prefix}
        {commentsLine(status)}
      </span>
      <span className="block max-w-[14rem] truncate text-xs text-slate-500">
        {status.complete === 0 ? 'None in yet' : `Missing ${missingSubjects(status)}`}
      </span>
    </span>
  )
}

function menuItems(row: Row, actions: RowActions, doc: ReportDoc, waiting?: WaitingState): RowMenuItem[] {
  const items: RowMenuItem[] = [{ key: 'download', label: 'Download PDF', icon: ArrowDownTrayIcon, onSelect: () => actions.download(row) }]
  if (waiting) return items
  if (row.status === 'emailed' || row.status === 'updated') {
    items.push({ key: 'again', label: 'Email family again', icon: EnvelopeIcon, onSelect: () => actions.emailFamily(row) })
  }
  if (row.student) items.push({ key: 'regenerate', label: 'Regenerate', icon: ArrowPathIcon, onSelect: () => actions.generate([row.studentId]) })
  items.push({ key: 'delete', label: `Delete ${doc.noun}`, icon: TrashIcon, danger: true, separated: true, onSelect: () => actions.remove(row) })
  return items
}

function WaitingChip({ state }: { state: WaitingState }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-cyan-800" role="status">
      <span
        className={`h-3.5 w-3.5 rounded-full border-2 ${state === 'printing' ? 'animate-spin border-cyan-200 border-t-cyan-600 motion-reduce:animate-none' : 'border-slate-300'}`}
        aria-hidden="true"
      />
      {state === 'printing' ? 'Generating…' : 'Queued'}
    </span>
  )
}

function RowButtons({ row, actions, opening, doc, waiting }: { row: Row; actions: RowActions; opening: boolean; doc: ReportDoc; waiting?: WaitingState }) {
  if (!row.report) {
    if (waiting) return <WaitingChip state={waiting} />
    return row.student ? (
      <button type="button" onClick={() => actions.generate([row.studentId])} className={generateButton} aria-label={`Generate ${row.name}'s ${doc.noun}`}>
        <DocumentPlusIcon className="h-4 w-4" aria-hidden="true" />
        Generate
      </button>
    ) : null
  }
  return (
    <>
      {waiting && <WaitingChip state={waiting} />}
      <button type="button" onClick={() => actions.view(row)} disabled={opening} className={plainButton} aria-label={`View ${row.name}'s ${doc.noun}`}>
        {opening ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" aria-hidden="true" />
        ) : (
          <EyeIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
        )}
        View
      </button>
      <RosterRowMenu label={`More for ${row.name}`} items={menuItems(row, actions, doc, waiting)} />
    </>
  )
}

export default function RosterTable({ doc, rows, selectedIds, onToggle, onToggleAll, actions, openingId, comments, waiting }: Props) {
  const heading = `${doc.noun[0].toUpperCase()}${doc.noun.slice(1)}`
  const allRef = useRef<HTMLInputElement>(null)
  const selectedShown = rows.filter((r) => selectedIds.includes(r.studentId)).length
  const allSelected = rows.length > 0 && selectedShown === rows.length

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = selectedShown > 0 && !allSelected
  }, [selectedShown, allSelected])

  return (
    <>
      {/* md and up: a table */}
      <table className="hidden w-full text-sm md:table">
        <thead className="sticky top-20 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
          <tr className="text-left text-xs font-medium text-slate-500">
            <th scope="col" className="w-12 py-2.5 pl-4 pr-2">
              <input ref={allRef} type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select every student shown" className={checkboxClass} />
            </th>
            <th scope="col" className="px-3 py-2.5">Student</th>
            <th scope="col" className="px-3 py-2.5">Grade</th>
            {comments && (
              <th scope="col" className="px-3 py-2.5">
                Teacher comments
              </th>
            )}
            <th scope="col" className="px-3 py-2.5">{heading}</th>
            <th scope="col" className="px-3 py-2.5">Family email</th>
            <th scope="col" className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const checked = selectedIds.includes(row.studentId)
            return (
              <tr key={row.studentId} className={`transition-colors ${checked ? 'bg-cyan-50/40' : 'hover:bg-slate-50/70'}`}>
                <td className="py-2.5 pl-4 pr-2">
                  <input type="checkbox" checked={checked} onChange={() => onToggle(row.studentId)} aria-label={`Select ${row.name}`} className={checkboxClass} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar student name={row.name} avatar={row.student?.avatar ?? null} photoUrl={row.student?.photoUrl ?? null} size={32} />
                    <Name row={row} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-600">{row.grade === '-' ? '—' : row.grade}</td>
                {comments && (
                  <td className="px-3 py-2.5">
                    <CommentsCell row={row} status={comments.get(row.studentId)} />
                  </td>
                )}
                <td className="whitespace-nowrap px-3 py-2.5">
                  <ReportStatus row={row} />
                </td>
                <td className="px-3 py-2.5">
                  <EmailStatus row={row} actions={actions} waiting={waiting?.get(row.studentId)} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <RowButtons row={row} actions={actions} opening={openingId === row.studentId} doc={doc} waiting={waiting?.get(row.studentId)} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Phones: a card per student */}
      <ul className="divide-y divide-slate-100 md:hidden">
        <li className="flex items-center gap-3 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
          <input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select every student shown" className={checkboxClass} />
          Select all {rows.length}
        </li>
        {rows.map((row) => {
          const checked = selectedIds.includes(row.studentId)
          return (
            <li key={row.studentId} className={`space-y-3 px-4 py-3 ${checked ? 'bg-cyan-50/40' : ''}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={checked} onChange={() => onToggle(row.studentId)} aria-label={`Select ${row.name}`} className={checkboxClass} />
                <Avatar student name={row.name} avatar={row.student?.avatar ?? null} photoUrl={row.student?.photoUrl ?? null} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <Name row={row} />
                    <span className="shrink-0 text-xs text-slate-500">{gradeLabel(row.grade)}</span>
                  </div>
                  <div className="mt-0.5 text-[13px]">
                    <ReportStatus row={row} />
                  </div>
                  {comments && comments.get(row.studentId)?.total ? (
                    <div className="mt-1 text-[13px]">
                      <CommentsCell row={row} status={comments.get(row.studentId)} prefix="Comments: " />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <EmailStatus row={row} actions={actions} waiting={waiting?.get(row.studentId)} />
                <div className="ml-auto flex items-center gap-1.5">
                  <RowButtons row={row} actions={actions} opening={openingId === row.studentId} doc={doc} waiting={waiting?.get(row.studentId)} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
