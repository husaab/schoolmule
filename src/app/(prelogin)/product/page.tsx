// File: src/app/product/page.tsx
'use client'
import { FC } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Image from 'next/image'
import Link from 'next/link'

const ProductPage: FC = () => {
  return (
    <>
      <PreNavBar />
      <main className="font-sans bg-white text-gray-800 py-35 px-6 lg:px-20">
        <section className="max-w-5xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Discover SchoolMule
            </h1>
            <p className="text-lg text-gray-600">
              An intuitive web application that empowers schools to manage students,
              automate report cards, and gain actionable insights—without the headache.
            </p>
          </div>

          {/* Screenshot */}
          <div className="flex justify-center">
            <Image
              src="/assets/images/product-screenshot.png"
              alt="SchoolMule Dashboard Screenshot"
              width={800}
              height={450}
              className="rounded-lg shadow-lg"
            />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Comprehensive Dashboard</h2>
              <p className="text-gray-600">
                View attendance, grades, and announcements all in one place. Customize widgets
                and get real-time updates on your school’s performance metrics.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Automated Report Cards</h2>
              <p className="text-gray-600">
                Define grading scales, import scores, and generate professional PDF report cards
                with a single click. Email directly to parents or print in bulk.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Attendance & Scheduling</h2>
              <p className="text-gray-600">
                Easily create class schedules, track daily attendance, and automatically flag
                absences. Export attendance logs or sync with your existing calendar.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Analytics & Exports</h2>
              <p className="text-gray-600">
                Dive into performance trends, compare class averages, and export data to CSV
                or Excel. Make data-driven decisions with confidence.
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="text-center pt-8">
            <p className="text-lg text-gray-700 mb-4">
              Ready to simplify your administrative workflow?
            </p>
            <Link href="/signup" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition">
                Create Your Account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ProductPage
