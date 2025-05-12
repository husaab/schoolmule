// File: src/app/about/page.tsx
'use client'
import { FC } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'

const AboutPage: FC = () => {
  return (
    <>
      {/* Navbar for pre-login */}
      <PreNavBar />

      <main className="font-sans bg-white text-gray-800 py-36 px-6 lg:px-20">
        <section className="max-w-4xl mx-auto space-y-5">
          <h2 className="text-3xl font-bold text-center">About SchoolMule</h2>

          <p className="text-lg leading-relaxed pt-3">
            SchoolMule is a modern, all-in-one web application designed to simplify and streamline the
            day-to-day operations of educational institutions. From student enrollment to grade reporting,
            SchoolMule automates the most time-consuming tasks so administrators, teachers, and parents
            can focus on what matters most—student success.
          </p>

          <h3 className="text-2xl font-semibold pt-3">Key Features</h3>
          <ul className="list-disc list-inside space-y-2 text-lg">
            <li>
              <strong>Student Management:</strong> Quickly add, edit, and organize student profiles,
              contact information, and enrollment status.
            </li>
            <li>
              <strong>Scheduling & Attendance:</strong> Build custom class schedules, track attendance,
              and generate absence reports with a single click.
            </li>
            <li>
              <strong>Automated Report Cards:</strong> Define grading scales, input scores, and let
              SchoolMule generate polished report cards in PDF format—ready to print or email.
            </li>
            <li>
              <strong>Parent Portal:</strong> Give parents secure access to their child’s grades,
              attendance records, and school announcements.
            </li>
            <li>
              <strong>Analytics & Insights:</strong> Visualize class performance trends, identify at-risk
              students, and export custom reports to CSV or PDF.
            </li>
            <li>
              <strong>Secure Authentication:</strong> Role-based access, JWT tokens, and audit logs keep
              your data safe and compliant.
            </li>
          </ul>

          <h3 className="text-2xl font-semibold pt-3">Get Started</h3>
          <p className="text-lg leading-relaxed">
            Ready to see how SchoolMule can transform your school’s workflow?{' '}
            <Link href="/signup" className="text-blue-600 font-semibold underline hover:text-blue-500">
                Create your free account
            </Link>{' '}
            today, or{' '}
            <Link href="/login" className="text-blue-600 font-semibold underline hover:text-blue-500">
                log in
            </Link>{' '}
            if you already have an account.
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default AboutPage
