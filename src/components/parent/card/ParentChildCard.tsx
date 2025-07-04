'use client'

import React from 'react'
import { ParentStudentPayload } from '@/services/types/parentStudent'

interface ParentChildCardProps {
  childLink: ParentStudentPayload
}

const ParentChildCard: React.FC<ParentChildCardProps> = ({ childLink }) => {
  const { student, relation, studentId } = childLink

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between h-full">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {student?.name || 'Unnamed Student'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Grade: {student?.grade ?? 'N/A'}
        </p>
        <p className="text-sm text-gray-500 mt-1 italic">
          Relation: {relation}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/parent/feedback?studentId=${studentId}`}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg text-sm hover:bg-blue-500"
        >
          View Student Assessments & Feedback
        </a>
        <a
          href={`/parent/report-cards?studentId=${studentId}`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
        >
          View Report Card
        </a>
      </div>
    </div>
  )
}

export default ParentChildCard
