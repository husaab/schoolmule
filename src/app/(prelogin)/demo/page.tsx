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

  return (
    <>
      <PreNavBar />
      <main className="font-sans bg-gradient-to-b from-white to-gray-50 min-h-screen flex flex-col items-center justify-center p-5 pt-30">
        <section className="bg-white shadow-lg rounded-xl p-10 max-w-2xl text-center space-y-6">
          <h1 className="text-2xl font-extrabold text-gray-800">Experience SchoolMule</h1>
          <p className="text-gray-600 text-lg">
            Want to explore SchoolMule? Try the live playground by booking a personalized walkthrough with our team.
          </p>

      <div
        className="calendly-inline-widget"
        data-url="https://calendly.com/husseinsaab14/30min"
        style={{ minWidth: '600px', height: '650px' }}
      />
      <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>

        </section>
      </main>
      <Footer/>

    </>
  )
}
