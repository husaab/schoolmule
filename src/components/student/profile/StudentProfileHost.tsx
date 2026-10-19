'use client'

// The student profile modal, mounted once in the (user) layout so any staff
// page can open it without navigating: it shows whenever the URL carries
// ?profile=<studentId> (see lib/studentProfileUrl and hooks/useStudentProfile).
// Parents never get it; their portal has its own child views.

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Modal from '@/components/shared/modal'
import { useUserStore } from '@/store/useUserStore'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import { readStudentProfile, type OpenStudentProfile } from '@/lib/studentProfileUrl'
import StudentProfile from './StudentProfile'

const StudentProfileHost = () => {
  const searchParams = useSearchParams()
  const user = useUserStore((s) => s.user)
  const { setView, close } = useStudentProfile()

  const isStaff = Boolean(user.id) && (user.role === 'ADMIN' || user.role === 'TEACHER')
  const profile = isStaff ? readStudentProfile(searchParams) : null

  // Keep the last profile on screen while the modal fades out after closing.
  const [shown, setShown] = useState<OpenStudentProfile | null>(null)
  if (profile && JSON.stringify(profile) !== JSON.stringify(shown)) setShown(profile)
  const view = profile ?? shown

  return (
    <Modal
      isOpen={profile != null}
      onClose={close}
      closeOnEscape
      fullScreenOnMobile
      ariaLabel="Student profile"
      style="w-full max-w-6xl h-full sm:h-[90vh]"
      maxHeightClass="max-h-full sm:max-h-[90vh]"
    >
      {/* Keyed so moving to another student starts from a clean slate. */}
      {view && <StudentProfile key={view.studentId} view={view} onView={setView} onClose={close} />}
    </Modal>
  )
}

export default StudentProfileHost
