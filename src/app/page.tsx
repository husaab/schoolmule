// File: src/app/welcome/page.tsx
import { FC } from 'react'
import type { Metadata } from "next";
import Link from 'next/link'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { CheckCircleIcon, ChartBarIcon, DocumentTextIcon, UserGroupIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

export const metadata: Metadata = {
  title: {
    default: 'SchoolMule: Student Management System',
    template: '%s - SchoolMule'
  },
  description: "SchoolMule is a simple, modern platform for attendance, grades, report cards, and parent communication. Streamline your school administration with SchoolMule.",
  alternates: { canonical: 'https://schoolmule.ca' },
  robots: { index: true, follow: true },
  applicationName: 'SchoolMule',
  keywords: ["school management", "student information system", "attendance tracking", "gradebook", "parent portal", "education software"],
  authors: [{ name: "SchoolMule" }],
  metadataBase: new URL('https://schoolmule.ca'),
  openGraph: {
    title: "SchoolMule: School Management System",
    description: 'All-in-one platform for attendance, grading, report cards, and parent communication.',
    type: "website",
    siteName: "SchoolMule",
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolMule: School Management System",
    description: 'All-in-one platform for attendance, grading, report cards, and parent communication.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

const WelcomePage: FC = () => {
  return (
    <>
      {/* Pre-login navigation bar */}
      <PreNavBar />

      <main className="font-sans bg-gray-50 w-full">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center space-y-8 py-36 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-xl lg:text-3xl font-bold text-gray-800 leading-tight">
              The Complete School Management Solution
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Stop juggling multiple systems. SchoolMule streamlines everything from student enrollment 
              to report cards, saving your staff hours each week while improving parent engagement.
            </p>

          </div>

          {/* Demo Video */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl p-8">
              <div 
                style={{ 
                  position: 'relative', 
                  paddingBottom: 'calc(52.60855982505467% + 41px)', 
                  height: 0, 
                  width: '100%' 
                }}
              >
                <iframe
                  src="https://demo.arcade.software/fnLPYXGsuJK8SZ1yxJjH?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
                  title="Welcome to SchoolMule"
                  frameBorder="0"
                  loading="lazy"
                  allowFullScreen
                  allow="clipboard-write"
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    colorScheme: 'light' 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/demo"
              className="px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition shadow-lg"
            >
              Request Demo
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-50 transition shadow-lg border border-gray-300"
            >
              Start Free Trial
            </Link>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Stop Spending Hours on Administrative Tasks
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                SchoolMule eliminates the chaos of juggling spreadsheets, paper records, and disconnected systems.
                One platform to run your entire school efficiently.
              </p>
            </div>

            {/* Core Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-cyan-200 transition-colors">
                  <UserGroupIcon className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Complete Student Information System</h3>
                <p className="text-gray-600 mb-4">
                  Centralize all student data, enrollment, grades, and parent contacts. No more scattered spreadsheets.
                </p>
                <div className="text-sm text-gray-500">
                  • Student profiles & contacts<br/>
                  • Class enrollment management<br/>
                  • Multi-term grade tracking
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="bg-green-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-green-200 transition-colors">
                  <DocumentTextIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Automated Report Card Generation</h3>
                <p className="text-gray-600 mb-4">
                  Generate professional PDF report cards in minutes, not hours. Bulk processing for entire grades.
                </p>
                <div className="text-sm text-gray-500">
                  • One-click PDF generation<br/>
                  • Teacher feedback integration<br/>
                  • Bulk processing capabilities
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-blue-200 transition-colors">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Smart Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Real-time insights into attendance, grades, and school performance. Make data-driven decisions.
                </p>
                <div className="text-sm text-gray-500">
                  • Attendance rate tracking<br/>
                  • Academic performance trends<br/>
                  • Financial health monitoring
                </div>
              </div>

              {/* Feature 4 */}
              <div className="group p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-purple-200 transition-colors">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Intelligent Scheduling System</h3>
                <p className="text-gray-600 mb-4">
                  Visual schedule builder with conflict detection. Manage complex schedules across all grades effortlessly.
                </p>
                <div className="text-sm text-gray-500">
                  • Drag-and-drop scheduling<br/>
                  • Conflict detection<br/>
                  • Multi-grade coordination
                </div>
              </div>

              {/* Feature 5 */}
              <div className="group p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-orange-200 transition-colors">
                  <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Integrated Financial Management</h3>
                <p className="text-gray-600 mb-4">
                  Handle tuition, payments, and invoicing within the same system. No separate billing software needed.
                </p>
                <div className="text-sm text-gray-500">
                  • Automated invoice generation<br/>
                  • Payment tracking<br/>
                  • Financial reporting
                </div>
              </div>

              {/* Feature 6 */}
              <div className="group p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="bg-red-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-red-200 transition-colors">
                  <CheckCircleIcon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Dedicated Parent Portal</h3>
                <p className="text-gray-600 mb-4">
                  Keep parents engaged with real-time access to grades, attendance, and school communications.
                </p>
                <div className="text-sm text-gray-500">
                  • Real-time grade access<br/>
                  • Attendance monitoring<br/>
                  • Direct communication
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Showcase Section */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">See SchoolMule in Action</h2>
              <p className="text-xl text-gray-600">
                Screenshots of key features that make school management effortless
              </p>
            </div>

            <div className="space-y-20">
              {/* Dashboard Screenshot */}
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-2/3">
                  <div className="aspect-video bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <Image
                      src="/images/DashboardScreenshot.png"
                      alt="SchoolMule Dashboard Screenshot showing real-time analytics"
                      width={1920}
                      height={1080}
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                </div>
                <div className="lg:w-1/3">
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">Executive Dashboard</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Get a complete overview of your school&apos;s performance with real-time attendance rates, 
                    academic trends, and financial insights—all in one beautiful dashboard.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Live attendance and academic metrics
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Financial health monitoring
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Customizable time periods
                    </li>
                  </ul>
                </div>
              </div>

              {/* Gradebook Screenshot */}
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="lg:w-2/3">
                  <div className="aspect-video bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <Image
                      src="/images/GradebookScreenshot.png"
                      alt="SchoolMule Gradebook Screenshot showing grade calculations and assessments"
                      width={1920}
                      height={1080}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="lg:w-1/3">
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">Smart Gradebook System</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Weighted assessments, automatic calculations, and instant report card generation. 
                    Spend less time on math, more time teaching.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Weighted assessment categories
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Real-time grade calculations
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Bulk grade entry capabilities
                    </li>
                  </ul>
                </div>
              </div>

              {/* Parent Portal Screenshot */}
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-2/3">
                  <div className="aspect-video bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <Image
                      src="/images/ParentPortalScreenshot.png"
                      alt="SchoolMule Parent Portal Screenshot showing parent dashboard and child progress"
                      width={1920}
                      height={1080}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="lg:w-1/3">
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">Parent Engagement Portal</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Keep parents connected with dedicated dashboards showing their children&apos;s progress, 
                    attendance, and school communications.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Individual child dashboards
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Real-time report card access
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      Direct school communication
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="bg-white py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              Return on Investment That Speaks for Itself
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6">
                <div className="text-4xl font-bold text-cyan-600 mb-2">20+</div>
                <div className="text-lg font-semibold text-gray-800">Hours Saved</div>
                <div className="text-gray-600">Per week on admin tasks</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-lg font-semibold text-gray-800">Faster</div>
                <div className="text-gray-600">Report card generation</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-lg font-semibold text-gray-800">Accuracy</div>
                <div className="text-gray-600">In grade calculations</div>
              </div>
            </div>
            <p className="text-xl text-gray-600 mb-8">
&quot;SchoolMule has transformed how we operate. What used to take our staff hours 
              now happens with just a few clicks. Our teachers can focus on teaching, 
              not administrative work.&quot;
            </p>
            <p className="text-lg text-gray-700 font-semibold">
              — Principal, Private Elementary School
            </p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-20">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl font-bold">Ready to Transform Your School?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              Join forward-thinking schools that have streamlined their operations with SchoolMule. 
              Schedule a personalized demo or start your free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link 
                href="/demo" 
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg border-2 border-white"
              >
                Schedule Demo
              </Link>
            </div>
            
            <div className="pt-8 text-sm opacity-75">
              <p>Questions? Contact us at schoolmule.official@gmail.com</p>
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
