'use client'

// A student's name that opens their profile modal over the current page.
// It is a real link, so cmd/ctrl-click still opens the profile in a new tab,
// and it never triggers the row or card it sits in.

import React from 'react'
import { useStudentProfile } from '@/hooks/useStudentProfile'

interface StudentNameLinkProps {
  studentId: string
  children: React.ReactNode
  className?: string
}

const StudentNameLink: React.FC<StudentNameLinkProps> = ({ studentId, children, className }) => {
  const { open, hrefFor } = useStudentProfile()
  return (
    <a
      href={hrefFor(studentId)}
      title="Open student profile"
      className={className ?? 'hover:text-cyan-700 hover:underline'}
      onClick={(e) => {
        e.stopPropagation()
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        open(studentId)
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  )
}

export default StudentNameLink
