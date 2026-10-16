// src/components/studentAccounts/LinkStudentAccountModal.tsx
// Link an existing student login to this year's student row (a returning or
// re-enrolled student keeps their login and password), or unlink it.
'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts, inputClass } from '@/components/shared/modalKit'
import { getUnlinkedStudentAccounts, linkStudentAccount, unlinkStudentAccount } from '@/services/studentAccountService'
import type { StudentAccountRow, UnlinkedStudentUser } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { STATUS_LABELS, gradeLabel } from '@/lib/studentAccounts'
import { LinkIcon, LinkSlashIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  row: StudentAccountRow
  mode: 'link' | 'unlink'
  onSaved: (row: StudentAccountRow) => void
}

export default function LinkStudentAccountModal({ isOpen, onClose, row, mode, onSaved }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [candidates, setCandidates] = useState<UnlinkedStudentUser[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [choice, setChoice] = useState<string>('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || mode !== 'link') return
    let cancelled = false
    setCandidates(null)
    setLoadError(null)
    setChoice('')
    setSearch('')
    getUnlinkedStudentAccounts()
      .then((res) => {
        if (cancelled) return
        setCandidates(res.data)
        // Preselect a login whose address matches the student's own.
        const match = res.data.find((u) => row.studentEmail && u.email.toLowerCase() === row.studentEmail.toLowerCase())
        if (match) setChoice(match.userId)
      })
      .catch((err) => !cancelled && setLoadError(err instanceof Error ? err.message : "Couldn't load student accounts"))
    return () => {
      cancelled = true
    }
  }, [isOpen, mode, row.studentEmail])

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (candidates ?? []).filter(
      (u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
    )
  }, [candidates, search])

  const handleLink = async () => {
    if (!choice) return
    setSaving(true)
    try {
      const res = await linkStudentAccount(row.studentId, choice)
      notify(`Account linked to ${row.name}`, 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : "The account couldn't be linked", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUnlink = async () => {
    setSaving(true)
    try {
      const res = await unlinkStudentAccount(row.studentId)
      notify(`Account unlinked from ${row.name}`, 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : "The account couldn't be unlinked", 'error')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'unlink') {
    const email = row.account?.email ?? ''
    return (
      <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-md">
        <ModalHeader title="Unlink account" subtitle={row.name} icon={LinkSlashIcon} tone="warning" />
        <ModalBody>
          <ConfirmBody
            tone="warning"
            consequences={{
              title: 'What happens:',
              items: [
                `${row.name} can't sign in until the account is linked to a student again`,
                'The login is kept and can be linked again from this page',
                'Nothing is deleted',
              ],
            }}
          >
            Unlink <strong className="font-semibold text-slate-900">{email}</strong> from {row.name} for this school year?
          </ConfirmBody>
          <RecordFacts
            facts={[
              { label: 'Student', value: row.name },
              { label: 'Grade', value: gradeLabel(row.grade) },
              { label: 'Email', value: email },
              { label: 'Status', value: STATUS_LABELS[row.status] },
            ]}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleUnlink} loading={saving}>
            Unlink account
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-lg">
      <ModalHeader title="Link existing account" subtitle={`${row.name} · ${gradeLabel(row.grade)}`} icon={LinkIcon} />
      <ModalBody>
        <p className="text-sm text-slate-600">
          Student logins with no student record this school year are listed here, for example after a transfer or a
          re-enrolment. Linking keeps the login&apos;s email and password.
        </p>

        {loadError ? (
          <p className="text-sm text-rose-600">{loadError}</p>
        ) : candidates === null ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No unlinked student accounts. To give {row.name} a login, add an email and send an invite instead.
          </div>
        ) : (
          <>
            {candidates.length > 6 && (
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search names or emails"
                aria-label="Search student accounts"
                className={inputClass}
              />
            )}
            <ul role="radiogroup" aria-label="Student accounts" className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
              {shown.map((u) => (
                <li key={u.userId}>
                  <label className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${choice === u.userId ? 'bg-cyan-50/60' : 'hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="link-student-account"
                      value={u.userId}
                      checked={choice === u.userId}
                      onChange={() => setChoice(u.userId)}
                      className="h-4 w-4 cursor-pointer border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{u.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {u.email}
                        {u.lastSchoolYearLabel && ` · last linked ${u.lastSchoolYearLabel}`}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
              {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">No matching accounts</li>}
            </ul>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleLink} loading={saving} disabled={!choice}>
          <LinkIcon className="h-4 w-4" />
          Link account
        </Button>
      </ModalFooter>
    </Modal>
  )
}
