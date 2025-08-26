'use client'

import { FC, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { useNotificationStore } from '@/store/useNotificationStore'
import { validateResetToken, resetPassword } from '@/services/passwordService'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

const ResetPasswordPage: FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const notify = useNotificationStore(s => s.showNotification)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await validateResetToken(token)
        setIsValidToken(response.success)
        if (!response.success) {
          notify(response.message || 'Invalid or expired token.', 'error')
          router.replace('/')
        }
      } catch {
        setIsValidToken(false)
        notify('Something went wrong validating the token.', 'error')
      }
    }

    if (token) checkToken()
  }, [token, notify, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      notify('Passwords do not match.', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await resetPassword(token, newPassword)
      if (response.success) {
        notify('Password reset successfully. You can now log in.', 'success')
        router.push('/login')
      } else {
        notify(response.message || 'Failed to reset password.', 'error')
      }
    } catch {
      notify('Server error. Please try again later.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PreNavBar />
      <main className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-16 sm:py-24">
        <section className="bg-white rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg p-6 sm:p-8">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Reset Your Password
          </h2>

          {isValidToken === null ? (
            <p className="text-center text-gray-500">Validating token...</p>
          ) : isValidToken === false ? (
            <p className="text-red-600 text-center">This link is invalid or has expired.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="text-black block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-[34px] text-gray-500"
                >
                  <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                </button>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="text-black block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition cursor-pointer"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ResetPasswordPage
