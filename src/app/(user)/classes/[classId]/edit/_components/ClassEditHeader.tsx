// File: src/app/(user)/classes/[classId]/edit/_components/ClassEditHeader.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ClassPayload } from '@/services/types/class'
import { getGradeDisplayName, isJK, isSK } from '@/lib/schoolUtils'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'

interface ClassEditHeaderProps {
  classData: ClassPayload
  onDuplicate: () => void
}

const ClassEditHeader: React.FC<ClassEditHeaderProps> = ({ classData, onDuplicate }) => {
  const router = useRouter()
  const { classId, grade, subject, teacherName } = classData

  const gradebookHref = isJK(grade)
    ? `/gradebook/jk/${classId}`
    : isSK(grade)
      ? `/gradebook/sk/${classId}`
      : `/gradebook/${classId}`

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <button
          onClick={() => router.push('/classes')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Edit Class
        </h1>
        <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg text-sm font-medium">
          {getGradeDisplayName(grade)}
        </span>
        <Link
          href={gradebookHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all cursor-pointer"
          title="Open Gradebook"
        >
          <BookOpenIcon className="h-4 w-4" />
          Go to Gradebook
        </Link>
        <button
          onClick={onDuplicate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-purple-600 transition-all cursor-pointer"
          title="Duplicate Class"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
          Duplicate
        </button>
      </div>
      <p className="text-slate-500 ml-12">{subject} • {teacherName}</p>
    </div>
  )
}

export default ClassEditHeader
