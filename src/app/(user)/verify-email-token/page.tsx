'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { confirmEmail } from '@/services/authService'

export default function VerifyEmailTokenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const notify = useNotificationStore((s) => s.showNotification)
  const clearUser = useUserStore((s) => s.clearUser)

  const didRun = useRef(false)

 useEffect(() => {
  if (didRun.current) return
  didRun.current = true

  if (!token) {
    notify('No token provided', 'error')
    return router.replace('/login')
  }

  confirmEmail(token)
    .then((res) => {
      console.log(res);
      if (res.success || res.status === 200) {
        console.log("sent");
        notify("You've successfully verified your email, please login!", 'success')

        // ✅ Clear Zustand AND localStorage manually
        useUserStore.getState().clearUser()

        // ✅ Navigate after clearing
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      } else {
        notify('Verification failed', 'error')
      }
    })
    .catch((err) => {
      console.error(err)
      notify(err.message || 'Verification error', 'error')
    })
}, [token, notify, router])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-sky-50 px-4 py-20">
        <p className="text-lg text-gray-700">Verifying your email, please wait…</p>
      </main>
      <Footer />
    </div>
  )
}
