'use client'

import React from 'react'
import Modal from '@/components/shared/modal'
import { StaffPayload } from '@/services/types/staff'
import { PhoneIcon, EnvelopeIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'

interface StaffViewModalProps {
  isOpen: boolean
  onClose: () => void
  staff: StaffPayload
}

const StaffViewModal: React.FC<StaffViewModalProps> = ({
  isOpen,
  onClose,
  staff
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <div className="text-black">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{staff.fullName}</h2>
            <p className="text-sm text-gray-600">{staff.staffRole}</p>
          </div>
        </div>

        <div className="space-y-4">
          {staff.homeroomGrade && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-blue-900 mb-1">Homeroom Teacher</h3>
              <p className="text-sm text-blue-700">Grade {staff.homeroomGrade}</p>
            </div>
          )}

          {staff.teachingAssignments && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Teaching Assignments</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  {Array.isArray(staff.teachingAssignments) 
                    ? staff.teachingAssignments.map((assignment, index) => (
                        <div key={index} className="mb-1 last:mb-0">• {assignment}</div>
                      ))
                    : <div>{staff.teachingAssignments}</div>
                  }
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-3">
              {staff.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <a 
                      href={`mailto:${staff.email}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {staff.email}
                    </a>
                    {staff.emailContactHours && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {staff.emailContactHours}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {staff.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <a 
                      href={`tel:${staff.phone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {staff.phone}
                    </a>
                    {staff.phoneContactHours && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {staff.phoneContactHours}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {staff.preferredContact && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    <strong>Preferred Contact:</strong> {staff.preferredContact}
                  </div>
                </div>
              )}

              {!staff.email && !staff.phone && (
                <div className="text-sm text-gray-500 italic">
                  No contact information available
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400 pt-4 border-t">
            Added on {new Date(staff.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default StaffViewModal