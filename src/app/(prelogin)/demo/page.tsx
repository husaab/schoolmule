// File: src/app/prelogin/demo/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { login } from '@/services/authService'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import { Wand2 } from 'lucide-react'

export default function DemoPage() {
  const router = useRouter()
  const notify = useNotificationStore(s => s.showNotification)
  const setUser = useUserStore.getState().setUser

  const handlePlaygroundLogin = async () => {
    try {
      const response = await login({
        email: 'testschoolmule@gmail.com',
        password: '123456'
      })

      if (response.success) {
        const user = {
          id: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          school: response.data.school,
          isVerifiedEmail: response.data.isVerified,
          isVerifiedSchool: response.data.isVerifiedSchool
        }

        setUser(user)
        notify('Logged into playground successfully!', 'success')
        router.replace('/dashboard')
      }
    } catch (err: any) {
      notify('Failed to login to playground', 'error')
    }
  }

  return (
    <>
      <PreNavBar />
      <main className="font-sans bg-gradient-to-b from-white to-gray-50 min-h-screen flex flex-col items-center justify-center p-6">
        <section className="bg-white shadow-lg rounded-xl p-10 max-w-2xl text-center space-y-6">
          <div className="flex justify-center text-cyan-600">
            <Wand2 size={48} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800">Experience SchoolMule</h1>
          <p className="text-gray-600 text-lg">
            Want to explore SchoolMule without creating an account? Try the live playground or book a personalized walkthrough with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handlePlaygroundLogin}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition cursor-pointer"
            >
              Try in Playground
            </button>
            <Link
              href="/contact"
              className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition text-center cursor-pointer"
            >
              Book a Demo
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
