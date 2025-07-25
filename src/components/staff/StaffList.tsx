'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getStaffBySchool } from '@/services/staffService'
import { StaffPayload } from '@/services/types/staff'
import { PhoneIcon, EnvelopeIcon, ClockIcon, EyeIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import StaffViewModal from './view/StaffViewModal'
import StaffAddModal from './add/StaffAddModal'
import StaffEditModal from './edit/StaffEditModal'
import StaffDeleteModal from './delete/StaffDeleteModal'

interface StaffListProps {
  school: string
  showContactInfo?: boolean
  className?: string
  showActions?: boolean
}

const StaffList: React.FC<StaffListProps> = ({ 
  school, 
  showContactInfo = true, 
  className = '',
  showActions = true
}) => {
  const user = useUserStore(state => state.user)
  const [staff, setStaff] = useState<StaffPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState<StaffPayload | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState<StaffPayload | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState<StaffPayload | null>(null)

  // Role-based permissions
  const isParent = user.role === 'PARENT'
  const isAdmin = user.role === 'ADMIN'
  const canEdit = !isParent // Teachers and admins can edit
  const canDelete = isAdmin // Only admins can delete

  const loadStaff = useCallback(async () => {
      if (!school) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await getStaffBySchool(school)
        if (response.status === 'success') {
          setStaff(response.data)
        } else {
          setError(response.message || 'Failed to load staff')
        }
      } catch (err) {
        console.error('Error loading staff:', err)
        setError('Error loading staff')
      } finally {
        setLoading(false)
      }
    }, [school])

  useEffect(() => {
    loadStaff()
  }, [school, loadStaff])

  const reloadStaff = () => {
    loadStaff()
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center text-red-600 p-4 ${className}`}>
        {error}
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <div className={`${className}`}>
        {/* Add Staff Button for empty state */}
        {showActions && canEdit && (
          <div className="mb-6">
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Staff Member
            </button>
          </div>
        )}

        <div className="text-center text-gray-500 p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            👥
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Listed</h3>
          <p className="text-sm text-gray-500 mb-4">
            No staff members have been added yet.
          </p>
        </div>

        {/* Modals for empty state */}
        {addModalOpen && (
          <StaffAddModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdded={reloadStaff}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Add Staff Button */}
      {showActions && canEdit && (
        <div className="mb-6">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Staff Member
          </button>
        </div>
      )}

      <div className="space-y-4 max-h-[800px] overflow-y-auto">
        {staff.map((member) => (
          <div 
            key={member.staffId} 
            className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {member.fullName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {member.staffRole}
              </p>
              
              {member.homeroomGrade && (
                <p className="text-sm text-blue-600 mb-2">
                  Homeroom: Grade {member.homeroomGrade}
                </p>
              )}
              
              {member.teachingAssignments && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Teaching Assignments:</p>
                  <div className="text-sm text-gray-700">
                    {Array.isArray(member.teachingAssignments) 
                      ? member.teachingAssignments.join(', ')
                      : JSON.stringify(member.teachingAssignments)
                    }
                  </div>
                </div>
              )}
            </div>
            
            {showContactInfo && (
              <div className="mt-3 sm:mt-0 sm:ml-4 space-y-2 min-w-0 sm:max-w-xs">
                {member.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a 
                      href={`mailto:${member.email}`}
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {member.email}
                    </a>
                  </div>
                )}
                
                {member.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a 
                      href={`tel:${member.phone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}
                
                {member.preferredContact && (
                  <div className="text-xs text-gray-500">
                    Preferred: {member.preferredContact}
                  </div>
                )}
                
                {(member.phoneContactHours || member.emailContactHours) && (
                  <div className="text-xs text-gray-500 space-y-1">
                    {member.phoneContactHours && (
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Phone: {member.phoneContactHours}
                      </div>
                    )}
                    {member.emailContactHours && (
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Email: {member.emailContactHours}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setViewModalOpen(member)}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                  title="View Details"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                
                {canEdit && (
                  <button
                    onClick={() => setEditModalOpen(member)}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm cursor-pointer"
                    title="Edit Staff Member"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
                
                {canDelete && (
                  <button
                    onClick={() => setDeleteModalOpen(member)}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm cursor-pointer"
                    title="Delete Staff Member"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        ))}
      </div>

      {/* Modals */}
      {viewModalOpen && (
        <StaffViewModal
          isOpen={!!viewModalOpen}
          onClose={() => setViewModalOpen(null)}
          staff={viewModalOpen}
        />
      )}

      {addModalOpen && (
        <StaffAddModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onAdded={reloadStaff}
        />
      )}

      {editModalOpen && (
        <StaffEditModal
          isOpen={!!editModalOpen}
          onClose={() => setEditModalOpen(null)}
          staff={editModalOpen}
          onUpdated={reloadStaff}
        />
      )}

      {deleteModalOpen && (
        <StaffDeleteModal
          isOpen={!!deleteModalOpen}
          onClose={() => setDeleteModalOpen(null)}
          staff={deleteModalOpen}
          onDeleted={reloadStaff}
        />
      )}
    </div>
  )
}

export default StaffList