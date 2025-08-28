'use client'

import { FC, useState } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { useNotificationStore } from '@/store/useNotificationStore'
import { requestPasswordReset } from '@/services/passwordService'

const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const notify = useNotificationStore(s => s.showNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await requestPasswordReset(email)
      if (response.success) {
        setSent(true)
        notify('Password reset email sent successfully.', 'success')
      } else {
        notify(response.message || 'Something went wrong.', 'error')
      }
    } catch {
      notify('Internal server error.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PreNavBar />

      <main className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-16 sm:py-24">
        <section className="bg-white rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-8 md:p-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-800">
            Forgot Your Password?
          </h2>

          <p className="text-md text-gray-600 text-center mb-8">
            Enter your email and we&apos;ll send you a secure link to reset your password.
            The link will expire in 15 minutes.
          </p>

          {!sent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-black"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition cursor-pointer"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <p className="text-green-600 text-center text-lg font-medium">
              If your email is registered, a reset link has been sent.
            </p>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}

export default ForgotPasswordPage
