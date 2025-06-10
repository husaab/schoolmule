// File: src/app/prelogin/welcome/page.tsx
'use client'
import { FC } from 'react'
import Link from 'next/link'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'

const WelcomePage: FC = () => {
  return (
    <>
      {/* Pre-login navigation bar */}
      <PreNavBar />

      <main className="font-sans bg-gray-50 w-full">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center space-y-6 py-40 pb-20">
          <h1 className="text-5xl font-bold text-gray-800">Welcome to SchoolMule</h1>

          <video
            width="640"
            height="360"
            className="mx-auto rounded-md shadow-lg"
            controls
            preload="none"
          >
            <source src="/path/to/video.mp4" type="video/mp4" />
            <track
              src="/path/to/captions.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
            />
            Your browser does not support the video tag.
          </video>

          <p className="text-lg text-gray-600 max-w-2xl">
            Simplify school administration with SchoolMule: manage students, build schedules,
            automate report cards, and gain insights—all from one intuitive dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-400 transition"
            >
              Sign Up
            </Link>
          </div>
        </section>

        {/* Features Preview Section */}
        <section className="bg-white py-16 pb-30">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What SchoolMule Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card: Student Management */}
              <div className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2 text-black">Student Management</h3>
                <p className="text-gray-600">
                  Organize profiles, track enrollment, and keep all student data in one secure place.
                </p>
                <Link
                  href="/about#student-management"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >Learn More</Link>
              </div>

              {/* Card: Scheduling & Attendance */}
              <div className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-bold mb-2 text-black">Scheduling & Attendance</h3>
                <p className="text-gray-600">
                  Build custom schedules, record attendance, and generate absence reports easily.
                </p>
                <Link
                  href="/about#scheduling-attendance"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >Learn More</Link>
              </div>

              {/* Card: Automated Report Cards */}
              <div className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2 text-black">Automated Report Cards</h3>
                <p className="text-gray-600">
                  Input scores once and generate polished PDF report cards for printing or emailing.
                </p>
                <Link
                  href="/about#report-cards"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >Learn More</Link>
              </div>

              {/* Card: Analytics & Exports */}
              <div className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2 text-black">Analytics & Exports</h3>
                <p className="text-gray-600">
                  Visualize performance trends and export data to CSV or PDF for deeper insights.
                </p>
                <Link
                  href="/about#analytics-exports"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >Learn More</Link>
              </div>

              {/* Card: Parent Portal */}
              <div className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2 text-black">Parent Portal</h3>
                <p className="text-gray-600">
                  Provide parents secure access to grades, attendance, and school announcements.
                </p>
                <Link
                  href="/about#parent-portal"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >Learn More</Link>
              </div>

              {/* Card: Secure Access */}
              <div className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2 text-black">Secure Access</h3>
                <p className="text-gray-600">
                  Role-based permissions and audit logs ensure your data stays secure and compliant.
                </p>
                <Link
                  href="/about#security"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >Learn More</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-cyan-600 text-white py-16 pb-30">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Transform Your School?</h2>
            <p className="text-lg">
              Join hundreds of schools already simplifying administration with SchoolMule.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/login" className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition">
                Log In
              </Link>
              <Link href="/signup" className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition">
                Sign Up
              </Link>
            </div>
          </div>
          
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}

export default WelcomePage
