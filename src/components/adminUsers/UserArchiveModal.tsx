'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit'
import { archiveSchoolUser, getSchoolUserDetails } from '@/services/adminUserService'
import { ArchiveBlockers, SchoolUser } from '@/services/types/adminUser'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { ArchiveBoxArrowDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { formatDate, roleLabel } from './userDisplay'

interface UserArchiveModalProps {
  isOpen: boolean
  onClose: () => void
  user: SchoolUser
  onArchived: (user: SchoolUser) => void
}

const UserArchiveModal: React.FC<UserArchiveModalProps> = ({ isOpen, onClose, user, onArchived }) => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [blockers, setBlockers] = useState<ArchiveBlockers | null>(null)
  const [checking, setChecking] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const isStaff = user.role !== 'PARENT'

  // Parents have nothing to reassign; staff might still lead classes or a homeroom.
  useEffect(() => {
    if (!isOpen || !isStaff) return
    let cancelled = false
    setChecking(true)
    setBlockers(null)
    getSchoolUserDetails(user.userId)
      .then((res) => !cancelled && setBlockers(res.data.archiveBlockers))
      .catch(() => !cancelled && setBlockers({ classes: [], homeroomStudents: 0 }))
      .finally(() => !cancelled && setChecking(false))
    return () => {
      cancelled = true
    }
  }, [isOpen, isStaff, user.userId])

  const blocked = Boolean(blockers && (blockers.classes.length > 0 || blockers.homeroomStudents > 0))

  const handleArchive = async () => {
    setArchiving(true)
    try {
      const res = await archiveSchoolUser(user.userId)
      notify(`${user.fullName} was archived`, 'success')
      onArchived(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to archive user', 'error')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Archive user"
        subtitle="You can restore them at any time."
        icon={ArchiveBoxArrowDownIcon}
        tone="warning"
      />

      <ModalBody>
        <ConfirmBody
          tone="warning"
          consequences={{
            title: 'While archived:',
            items: [
              'They can no longer sign in to School Mule',
              'Hidden from staff attendance, pay periods and the hours sheet',
              'Left out of teacher pickers and the dashboard count',
              'Their classes, grades and attendance history are all kept',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{user.fullName}</strong> will be moved to the
          archive. Nothing is deleted.
        </ConfirmBody>

        {isStaff && checking && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner size="sm" />
            Checking this year&apos;s classes and homeroom
          </div>
        )}

        {blocked && blockers && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-rose-900">
            <p className="text-sm font-medium">Reassign these first</p>
            <p className="mt-1 text-sm opacity-90">
              They still lead classes or homeroom students this school year. Archiving would leave those
              pointing at a hidden account.
            </p>
            <ul className="mt-2 space-y-1">
              {blockers.classes.map((c) => (
                <li key={c.classId}>
                  <Link
                    href={`/classes/${c.classId}/edit`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose-800 underline-offset-2 hover:underline"
                  >
                    {getGradeDisplayName(c.grade)} · {c.subject}
                    {c.termName && <span className="font-normal opacity-70"> · {c.termName}</span>}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
              {blockers.homeroomStudents > 0 && (
                <li className="text-sm">
                  Homeroom teacher for {blockers.homeroomStudents}{' '}
                  {blockers.homeroomStudents === 1 ? 'student' : 'students'}
                </li>
              )}
            </ul>
          </div>
        )}

        <RecordFacts
          facts={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: roleLabel(user.role) },
            { label: 'Joined', value: formatDate(user.createdAt) },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={archiving}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handleArchive} loading={archiving} disabled={checking || blocked}>
          {archiving ? 'Archiving' : 'Archive user'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default UserArchiveModal
