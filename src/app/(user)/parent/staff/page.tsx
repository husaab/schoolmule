'use client'

import React from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import ParentPageShell from '@/components/parent/ParentPageShell'
import StaffList from '@/components/staff/StaffList'

const ParentStaffPage: React.FC = () => {
  const user = useUserStore((s) => s.user)

  return (
    <ParentPageShell
      title="Staff Directory"
      subtitle="Contact information for your school's staff members."
      badge={{ icon: UserGroupIcon, label: 'Staff' }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-6">
        {user.school && <StaffList school={user.school} showContactInfo={true} showActions={true} />}
      </div>
    </ParentPageShell>
  )
}

export default ParentStaffPage
