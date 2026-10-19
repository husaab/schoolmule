'use client'

import React from 'react'
import {
  CakeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  HomeIcon,
  IdentificationIcon,
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { GuardianCard, SectionLabel, clean } from './contact'
import { formatDay, formatStamp, relationLabel } from '@/lib/studentProfile'
import type { GuardianAccount, StudentOverview } from '@/services/types/studentProfile'
import { Card } from './ui'

const ACCOUNT_PILL: Record<GuardianAccount['status'], [string, string]> = {
  linked: ['Portal account', 'bg-emerald-50 text-emerald-700'],
  invited: ['Invite sent', 'bg-amber-50 text-amber-700'],
  none: ['No portal access', 'bg-slate-100 text-slate-500'],
}

const ProfileInfoTab: React.FC<{ overview: StudentOverview; onEdit: (() => void) | null }> = ({ overview, onEdit }) => {
  const s = overview.student
  const dob = clean(s.dateOfBirth)
  const address = clean(s.address)
  const healthCard = clean(s.healthCardNumber)
  const medical = clean(s.medicalNotes)
  const emergency = clean(s.emergencyContact)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card title="Guardians on file" subtitle="From the student record (registration or manual entry)">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <GuardianCard role="Mother" person={s.mother} />
            <GuardianCard role="Father" person={s.father} />
          </div>
        </Card>

        <Card title="Parent portal access" subtitle="Accounts linked to this student, who receive grades, report cards and messages" flush>
          {overview.guardianAccounts.length === 0 ? (
            <p className="px-6 pb-5 text-sm text-slate-400">No guardians linked yet. An admin can link them under Admin Panel → Parent Relations.</p>
          ) : (
            <ul className="divide-y divide-slate-50 pb-2">
              {overview.guardianAccounts.map((g) => {
                const [label, cls] = ACCOUNT_PILL[g.status]
                return (
                  <li key={g.linkId} className="flex items-center justify-between gap-4 px-6 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {clean(g.name) ?? 'Unnamed guardian'} <span className="text-xs font-normal text-slate-400">· {relationLabel(g.relation)}</span>
                      </p>
                      <p className="truncate text-xs text-slate-500">{clean(g.email) ?? 'No email'}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card
          title="Details"
          action={
            onEdit ? (
              <button onClick={onEdit} className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700">
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            ) : undefined
          }
        >
          <div className="space-y-5">
            <section className="space-y-2">
              <SectionLabel>Homeroom</SectionLabel>
              <p className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                {s.homeroomTeacherName ? <span className="text-slate-700">{s.homeroomTeacherName}</span> : <span className="text-slate-400">No homeroom teacher assigned</span>}
              </p>
            </section>

            <section className="space-y-2">
              <SectionLabel>Personal</SectionLabel>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <CakeIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  {dob ? <span className="text-slate-700">{formatDay(dob, { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="text-slate-400">No date of birth</span>}
                </p>
                <p className="flex items-center gap-2">
                  <IdentificationIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  {healthCard ? <span className="font-mono text-slate-700">{healthCard}</span> : <span className="text-slate-400">No health card number</span>}
                </p>
                <p className="flex items-start gap-2">
                  <HomeIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  {address ? <span className="text-slate-700">{address}</span> : <span className="text-slate-400">No address</span>}
                </p>
              </div>
            </section>

            {medical && (
              <section className="space-y-2">
                <SectionLabel>Medical</SectionLabel>
                <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2.5">
                  <HeartIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                  <span className="text-sm text-rose-900">{medical}</span>
                </div>
              </section>
            )}

            <section className="space-y-2">
              <SectionLabel>Emergency contact</SectionLabel>
              {emergency ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="text-sm text-amber-900">{emergency}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No emergency contact on file</p>
              )}
            </section>

            <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
              <p>
                Added {formatStamp(s.createdAt)} · Updated {formatStamp(s.lastModifiedAt)}
              </p>
              {s.sourceSubmissionId && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-slate-500">
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                  Imported from a registration form
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ProfileInfoTab
