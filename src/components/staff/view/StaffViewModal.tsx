'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { StaffPayload } from '@/services/types/staff'
import {
  AcademicCapIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

interface StaffViewModalProps {
  isOpen: boolean
  onClose: () => void
  staff: StaffPayload
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Small uppercase section heading — the only structural device in the modal. */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</h3>
)

/**
 * An email or phone number rendered as something you can actually act on:
 * a mailto:/tel: link with a copy button that confirms in place, plus the
 * hours the staff member said they answer on that channel.
 */
const ContactLine = ({
  kind,
  value,
  hours
}: {
  kind: 'email' | 'phone'
  value: string
  hours?: string
}) => {
  const [copied, setCopied] = useState(false)
  const Icon = kind === 'email' ? EnvelopeIcon : PhoneIcon

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch (err) {
      console.error('Could not copy to clipboard', err)
    }
  }

  return (
    <div className="group/line rounded-lg px-3 py-2 transition-colors hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <a
          href={kind === 'email' ? `mailto:${value}` : `tel:${value.replace(/[^\d+]/g, '')}`}
          className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-cyan-700 hover:underline"
          title={value}
        >
          {value}
        </a>
        <button
          type="button"
          onClick={copy}
          title={copied ? 'Copied' : `Copy ${kind}`}
          aria-label={copied ? 'Copied' : `Copy ${kind}`}
          className="flex-shrink-0 cursor-pointer rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 group-hover/line:opacity-100"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-emerald-600" />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      {hours && (
        <p className="mt-1 flex items-center gap-1.5 pl-6 text-xs text-slate-400">
          <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
          {hours}
        </p>
      )}
    </div>
  )
}

const StaffViewModal: React.FC<StaffViewModalProps> = ({
  isOpen,
  onClose,
  staff
}) => {
  const assignments = staff.teachingAssignments

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      {/* Identity */}
      <header className="border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-6 pt-6 pb-5">
        <div className="flex items-center gap-4 pr-8">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-semibold tracking-wide text-white shadow-sm">
            {initialsOf(staff.fullName)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-900">{staff.fullName}</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">{staff.staffRole}</p>
          </div>
        </div>

        {staff.homeroomGrade && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
              <AcademicCapIcon className="h-4 w-4" />
              Homeroom Grade {staff.homeroomGrade}
            </span>
          </div>
        )}
      </header>

      <div className="space-y-6 px-6 py-5">
        {/* Teaching assignments */}
        {assignments && (
          <section className="space-y-2">
            <SectionLabel>Teaching assignments</SectionLabel>
            <div className="space-y-1 text-sm text-slate-700">
              {Array.isArray(assignments) ? (
                assignments.map((assignment, index) => (
                  <div key={index} className="flex gap-2">
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span>{assignment}</span>
                  </div>
                ))
              ) : (
                <div>{assignments}</div>
              )}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="space-y-2">
          <SectionLabel>Contact</SectionLabel>
          {staff.email || staff.phone ? (
            <div className="space-y-1">
              {staff.email && (
                <ContactLine kind="email" value={staff.email} hours={staff.emailContactHours} />
              )}
              {staff.phone && (
                <ContactLine kind="phone" value={staff.phone} hours={staff.phoneContactHours} />
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No contact information on file</p>
          )}

          {staff.preferredContact && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
              <ChatBubbleLeftRightIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-sm text-amber-900">
                Prefers to be reached by {staff.preferredContact.toLowerCase()}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* Record trail + actions */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <p className="text-xs text-slate-400">Added {formatDate(staff.createdAt)}</p>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
        >
          Close
        </button>
      </footer>
    </Modal>
  )
}

export default StaffViewModal
