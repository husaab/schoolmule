'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getTermsBySchool, updateTermStatus } from '@/services/termService'
import { getSchoolByCode, updateSchool } from '@/services/schoolService'
import type { TermPayload } from '@/services/types/term'
import type { SchoolPayload } from '@/services/types/school'
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import TermAddModal from '@/components/terms/add/termAddModal'
import TermEditModal from '@/components/terms/edit/termEditModal'
import TermDeleteModal from '@/components/terms/delete/termDeleteModal'

const SchoolSettingsPage = () => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const hasHydrated = useUserStore((state) => state.hasHydrated)
  const showNotification = useNotificationStore((state) => state.showNotification)

  const [terms, setTerms] = useState<TermPayload[]>([])
  const [schoolData, setSchoolData] = useState<SchoolPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // School editing state
  const [isEditingSchool, setIsEditingSchool] = useState(false)
  const [schoolFormData, setSchoolFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    timezone: '',
    academicYearStartDate: '',
    academicYearEndDate: ''
  })
  
  // Term modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<TermPayload | null>(null)

    const fetchSchoolData = useCallback(async () => {
    if (!user?.school) return

    try {
      const res = await getSchoolByCode(user.school)
      if (res.status === 'success') {
        setSchoolData(res.data)
        // Populate form data for editing
        setSchoolFormData({
          name: res.data.name || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          timezone: res.data.timezone || '',
          academicYearStartDate: res.data.academicYearStartDate ? res.data.academicYearStartDate.split('T')[0] : '',
          academicYearEndDate: res.data.academicYearEndDate ? res.data.academicYearEndDate.split('T')[0] : ''
        })
      } 
    } catch (err) {
      console.error('Error fetching school data:', err)
    }
  }, [user.school]);

  const fetchTerms = useCallback(async () => {
    if (!user?.school) return

    try {
      const res = await getTermsBySchool(user.school)
      if (res.status === 'success') {
        setTerms(res.data)
      } else {
        setError('Failed to load terms')
      }
    } catch (err) {
      console.error('Error fetching terms:', err)
      setError('Error fetching terms')
    }
  }, [user.school]);

  useEffect(() => {
    // Wait for hydration before checking user
    if (!hasHydrated) {
      return
    }

    if (!user?.school) {
      setError('Unable to determine your school')
      setLoading(false)
      return
    }

    const fetchData = async () => {
        if (!user?.school) return

        setLoading(true)
        setError(null)
        
        try {
          await Promise.all([fetchSchoolData(), fetchTerms()])
        } catch (err) {
          console.error('Error fetching data:', err)
          setError('Error loading data')
        } finally {
          setLoading(false)
        }
    }

    fetchData()
  }, [hasHydrated, user?.school, fetchSchoolData, fetchTerms])

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.school || !schoolData) {
      showNotification('Unable to determine your school', 'error')
      return
    }

    try {
      const payload = {
        name: schoolFormData.name.trim(),
        address: schoolFormData.address.trim(),
        phone: schoolFormData.phone.trim(),
        email: schoolFormData.email.trim(),
        timezone: schoolFormData.timezone.trim(),
        academicYearStartDate: schoolFormData.academicYearStartDate || undefined,
        academicYearEndDate: schoolFormData.academicYearEndDate || undefined
      }

      const res = await updateSchool(schoolData.schoolId, payload)
      if (res.status === 'success') {
        showNotification('School information updated successfully', 'success')
        setIsEditingSchool(false)
        fetchSchoolData()
      } else {
        showNotification('Failed to update school information', 'error')
      }
    } catch (err) {
      console.error('Error updating school:', err)
      showNotification('Error updating school information', 'error')
    }
  }

  const handleAddTerm = (newTerm: TermPayload) => {
    setTerms(prev => [newTerm, ...prev])
  }

  const handleEditTerm = (term: TermPayload) => {
    setSelectedTerm(term)
    setShowEditModal(true)
  }

  const handleUpdateTerm = (updatedTerm: TermPayload) => {
    setTerms(prev => prev.map(term => 
      term.termId === updatedTerm.termId ? updatedTerm : term
    ))
  }

  const handleDeleteTerm = (term: TermPayload) => {
    setSelectedTerm(term)
    setShowDeleteModal(true)
  }

  const handleTermDeleted = (termId: string) => {
    setTerms(prev => prev.filter(term => term.termId !== termId))
  }

  const handleStatusChange = async (termId: string, newStatus: string) => {
    const isActive = newStatus === 'active'
    try {
      const res = await updateTermStatus(termId, isActive)
      if (res.status === 'success') {
        showNotification(`Term ${isActive ? 'activated' : 'deactivated'} successfully`, 'success')
        // Update the local state
        setTerms(prev => prev.map(term => 
          term.termId === termId 
            ? { ...term, isActive }
            : isActive 
              ? { ...term, isActive: false } // Deactivate other terms if this one is being activated
              : term
        ))
      } else {
        showNotification(`Failed to ${isActive ? 'activate' : 'deactivate'} term`, 'error')
      }
    } catch (err) {
      console.error('Error updating term status:', err)
      showNotification('Error updating term status', 'error')
    }
  }


  const handleCancelSchoolEdit = () => {
    setIsEditingSchool(false)
    // Reset form to original data
    if (schoolData) {
      setSchoolFormData({
        name: schoolData.name || '',
        address: schoolData.address || '',
        phone: schoolData.phone || '',
        email: schoolData.email || '',
        timezone: schoolData.timezone || '',
        academicYearStartDate: schoolData.academicYearStartDate ? schoolData.academicYearStartDate.split('T')[0] : '',
        academicYearEndDate: schoolData.academicYearEndDate ? schoolData.academicYearEndDate.split('T')[0] : ''
      })
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
          <div className="text-center">
            <p>Loading school settings...</p>
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/admin-panel')}
              className="mt-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
            >
              Back to Admin Panel
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold">School Settings</h1>
          </div>

          {/* School Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BuildingOfficeIcon className="h-6 w-6" />
                  School Information
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your school&apos;s basic information and settings
                </p>
              </div>
              {!isEditingSchool && (
                <button
                  onClick={() => setIsEditingSchool(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition cursor-pointer"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="p-6">
              {!isEditingSchool ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <p className="text-gray-900">{schoolData?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                    <p className="text-gray-900">{schoolData?.schoolCode || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900">{schoolData?.address || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{schoolData?.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{schoolData?.email || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <p className="text-gray-900">{schoolData?.timezone || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year Start</label>
                    <p className="text-gray-900">
                      {schoolData?.academicYearStartDate 
                        ? new Date(schoolData.academicYearStartDate).toLocaleDateString() 
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year End</label>
                    <p className="text-gray-900">
                      {schoolData?.academicYearEndDate 
                        ? new Date(schoolData.academicYearEndDate).toLocaleDateString() 
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSchoolSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                      <input
                        type="text"
                        value={schoolFormData.name}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter school name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={schoolFormData.address}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter school address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={schoolFormData.phone}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={schoolFormData.email}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter school email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <input
                        type="text"
                        value={schoolFormData.timezone}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="e.g., America/New_York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year Start</label>
                      <input
                        type="date"
                        value={schoolFormData.academicYearStartDate}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, academicYearStartDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year End</label>
                      <input
                        type="date"
                        value={schoolFormData.academicYearEndDate}
                        onChange={(e) => setSchoolFormData(prev => ({ ...prev, academicYearEndDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelSchoolEdit}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition cursor-pointer"
                    >
                      Update School Information
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Terms Management Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Academic Terms</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your school&apos;s academic terms and their schedules
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition cursor-pointer"
              >
                <PlusIcon className="h-5 w-5" />
                Add Term
              </button>
            </div>

            <div className="p-6">
              {terms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No terms have been created yet.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition cursor-pointer"
                  >
                    Create Your First Term
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {terms.map((term) => (
                    <div
                      key={term.termId}
                      className={`p-4 border rounded-lg ${
                        term.isActive ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{term.name}</h3>
                          </div>
                          <p className="text-gray-600">Academic Year: {term.academicYear}</p>
                          <p className="text-gray-600">
                            {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                              value={term.isActive ? 'active' : 'inactive'}
                              onChange={(e) => handleStatusChange(term.termId, e.target.value)}
                              className={`px-3 py-1 text-sm rounded-lg border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                term.isActive 
                                  ? 'bg-green-50 border-green-300 text-green-800' 
                                  : 'bg-white border-gray-300 text-gray-700'
                              }`}
                            >
                              <option value="inactive">Inactive</option>
                              <option value="active">Active</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditTerm(term)}
                              className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                              title="Edit term"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTerm(term)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete term"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-start">
            <button
              onClick={() => router.push('/admin-panel')}
              className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition cursor-pointer"
            >
              Back to Admin Panel
            </button>
          </div>
        </div>
      </main>

      {/* Term Modals */}
      <TermAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTerm}
      />

      {selectedTerm && (
        <TermEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateTerm}
          term={selectedTerm}
        />
      )}

      {selectedTerm && (
        <TermDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleTermDeleted}
          term={selectedTerm}
        />
      )}
    </>
  )
}

export default SchoolSettingsPage