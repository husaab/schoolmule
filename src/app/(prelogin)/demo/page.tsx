// File: src/app/prelogin/demo/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { login } from '@/services/authService'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import { CalendarDaysIcon, CheckCircleIcon, ChartBarIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function DemoPage() {
  const router = useRouter()
  const notify = useNotificationStore(s => s.showNotification)
  const setUser = useUserStore.getState().setUser

  return (
    <>
      <PreNavBar />
      <main className="font-sans bg-gray-50 py-40 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Schedule Your SchoolMule Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how SchoolMule can transform your school's operations. Book a personalized 
              30-minute demonstration tailored to your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Demo Benefits */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">What You'll See in Your Demo</h2>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Complete System Overview</h3>
                      <p className="text-gray-600">See all core features and how they work together</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Live Data Demonstration</h3>
                      <p className="text-gray-600">Watch real report card generation and grade calculations</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Parent Portal Walkthrough</h3>
                      <p className="text-gray-600">See how parents interact with your school data</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Q&A with Our Experts</h3>
                      <p className="text-gray-600">Get all your questions answered in real-time</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-cyan-50 rounded-xl p-8 border border-cyan-200">
                <div className="flex items-center space-x-3 mb-4">
                  <CalendarDaysIcon className="w-8 h-8 text-cyan-600" />
                  <h3 className="text-xl font-bold text-gray-800">Demo Details</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Duration:</strong> 60 minutes</li>
                  <li><strong>Format:</strong> Video call with screen sharing</li>
                  <li><strong>Customized:</strong> Tailored to your school size and needs</li>
                  <li><strong>Follow-up:</strong> Custom implementation plan provided</li>
                </ul>
              </div>

              {/* Feature Highlights */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Key Features You'll Experience</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="w-6 h-6 text-cyan-600" />
                    <span className="text-gray-700">Student Management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-6 h-6 text-green-600" />
                    <span className="text-gray-700">Report Cards</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="w-6 h-6 text-blue-600" />
                    <span className="text-gray-700">Analytics Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                    <span className="text-gray-700">Smart Scheduling</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendly Integration */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Book Your Demo</h2>
                <p className="text-gray-600">Choose a time that works best for you</p>
              </div>
              
              <div
                className="calendly-inline-widget rounded-lg overflow-hidden"
                data-url="https://calendly.com/husseinsaab14/30min"
                style={{ minWidth: '100%', height: '650px' }}
              />
              <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
            </div>
          </div>

          {/* Additional CTA Section */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join schools that have already streamlined their operations and improved parent engagement with SchoolMule.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
