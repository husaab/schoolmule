"use client"
import { useState } from 'react'
import { ArrowRightStartOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import Modal from '../shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { logout } from '@/services/authService'
import { useRouter } from 'next/navigation'

const LogoutModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const user = useUserStore((state) => state.user)
  const clearUser = useUserStore((state) => state.clearUser)
  const showNotification = useNotificationStore((state) => state.showNotification)
  const router = useRouter()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      clearUser()
      closeModal()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      showNotification('Logout failed. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer group"
      >
        <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-red-400 group-hover:text-red-500" />
        <span className="text-sm font-medium">Logout</span>
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal} size="sm">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {user.username ? `Goodbye, ${user.username}!` : 'Sign Out'}
            </h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to log out? You&apos;ll need to sign in again to access your account.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default LogoutModal
