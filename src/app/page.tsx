'use client'
import { FC, useEffect, useRef } from 'react'
import Link from 'next/link'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import {
  CheckCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'

// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-8')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = ref.current?.querySelectorAll('[data-reveal]')
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return ref
}

const features = [
  {
    icon: UserGroupIcon,
    title: 'Student Information System',
    description: 'Centralize all student data, enrollment, grades, and parent contacts in one secure location.',
    color: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    highlights: ['Student profiles', 'Parent contacts', 'Multi-term tracking']
  },
  {
    icon: DocumentTextIcon,
    title: 'Automated Report Cards',
    description: 'Generate professional PDF report cards in minutes with integrated teacher feedback.',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    highlights: ['One-click generation', 'Bulk processing', 'Custom templates']
  },
  {
    icon: ChartBarIcon,
    title: 'Smart Analytics',
    description: 'Real-time insights into attendance, grades, and school performance metrics.',
    color: 'bg-violet-50',
    iconColor: 'text-violet-600',
    highlights: ['Live dashboards', 'Trend analysis', 'Data exports']
  },
  {
    icon: ClockIcon,
    title: 'Intelligent Scheduling',
    description: 'Visual schedule builder with conflict detection across all grades and teachers.',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    highlights: ['Drag-and-drop', 'Conflict alerts', 'Multi-grade support']
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Financial Management',
    description: 'Handle tuition, payments, and invoicing without separate billing software.',
    color: 'bg-rose-50',
    iconColor: 'text-rose-600',
    highlights: ['Auto invoicing', 'Payment tracking', 'Revenue reports']
  },
  {
    icon: CheckCircleIcon,
    title: 'Parent Portal',
    description: 'Keep parents engaged with real-time access to grades, attendance, and communications.',
    color: 'bg-sky-50',
    iconColor: 'text-sky-600',
    highlights: ['Grade access', 'Attendance alerts', 'Direct messaging']
  }
]

const stats = [
  { value: '20+', label: 'Hours Saved', sublabel: 'Per week on admin' },
  { value: '100%', label: 'Faster', sublabel: 'Report card generation' },
  { value: '99.9%', label: 'Uptime', sublabel: 'Reliability guarantee' },
]

const WelcomePage: FC = () => {
  const containerRef = useScrollReveal()

  return (
    <div ref={containerRef} className="bg-white">
      <PreNavBar />

      <main className="w-full overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-32 pb-16 lg:pt-32 lg:pb-24">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 via-white to-slate-50" />

          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-teal-100/30 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cyan-200 shadow-sm mb-8">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-600">
                  Trusted by 50+ Schools Nationwide
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
                The Complete{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  School Management
                </span>{' '}
                Solution
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
                Stop juggling multiple systems. SchoolMule streamlines everything from
                student enrollment to report cards, saving your staff{' '}
                <span className="font-semibold text-slate-800">hours each week</span>.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Request Demo
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-300"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-emerald-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-emerald-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Screenshot */}
            <div className="mt-16 lg:mt-20">
              <div className="relative max-w-5xl mx-auto">
                {/* Floating notification - left */}
                <div className="absolute -left-4 lg:-left-12 top-1/4 hidden lg:block z-20">
                  <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Report Generated</p>
                        <p className="text-xs text-slate-500">Grade 5 - Complete</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification - right */}
                <div className="absolute -right-4 lg:-right-12 top-1/3 hidden lg:block z-20">
                  <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                        <UserGroupIcon className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">98.5%</p>
                        <p className="text-xs text-slate-500">Attendance Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Browser Mockup */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                  {/* Browser header */}
                  <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="bg-white rounded-md px-4 py-1.5 text-sm text-slate-500 max-w-md">
                        schoolmule.ca/dashboard
                      </div>
                    </div>
                  </div>
                  {/* Screenshot */}
                  <div className="relative aspect-[16/10]">
                    <Image
                      src="/images/DashboardScreenshot.png"
                      alt="SchoolMule Dashboard"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-cyan-500/20 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="text-center mb-12 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                See SchoolMule in Action
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Watch how easily you can manage your entire school from one dashboard
              </p>
            </div>

            <div
              data-reveal
              className="max-w-4xl mx-auto opacity-0 translate-y-8 transition-all duration-700"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
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
                      colorScheme: 'light',
                      borderRadius: '0.75rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  data-reveal
                  className="text-center p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 opacity-0 translate-y-8 transition-all duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xl font-semibold text-slate-800 mb-1">{stat.label}</div>
                  <div className="text-slate-500">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Everything You Need to{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Run Your School
                </span>
              </h2>
              <p className="text-lg text-slate-600">
                One platform to eliminate chaos, streamline operations, and improve parent engagement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  data-reveal
                  className="group relative p-6 lg:p-8 bg-white rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-300 opacity-0 translate-y-8"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Screenshot Showcase Section */}
        <section className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Powerful Features, Beautiful Interface
              </h2>
              <p className="text-lg text-slate-600">
                Designed for educators, by educators
              </p>
            </div>

            {/* Feature 1 - Gradebook */}
            <div className="mb-20 lg:mb-32">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div
                  data-reveal
                  className="order-2 lg:order-1 opacity-0 translate-y-8 transition-all duration-700"
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="bg-white rounded-md px-4 py-1.5 text-sm text-slate-500 max-w-md">
                          schoolmule.ca/gradebook
                        </div>
                      </div>
                    </div>
                    <div className="relative aspect-video">
                      <Image
                        src="/images/GradebookScreenshot.png"
                        alt="SchoolMule Gradebook"
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
                <div
                  data-reveal
                  className="order-1 lg:order-2 opacity-0 translate-y-8 transition-all duration-700"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
                    <ChartBarIcon className="w-4 h-4" />
                    Smart Gradebook
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    Grades Made Simple
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Weighted assessments, automatic calculations, and instant report card generation.
                    Spend less time on math, more time teaching.
                  </p>
                  <ul className="space-y-4">
                    {['Weighted assessment categories', 'Real-time grade calculations', 'Bulk grade entry capabilities'].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Feature 2 - Parent Portal */}
            <div className="mb-20 lg:mb-32">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div
                  data-reveal
                  className="opacity-0 translate-y-8 transition-all duration-700"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-sm font-medium mb-4">
                    <UserGroupIcon className="w-4 h-4" />
                    Parent Portal
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    Keep Parents Connected
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Dedicated dashboards showing children&apos;s progress, attendance, and school
                    communications. Build trust through transparency.
                  </p>
                  <ul className="space-y-4">
                    {['Individual child dashboards', 'Real-time report card access', 'Direct school communication'].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-4 h-4 text-violet-600" />
                        </div>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  data-reveal
                  className="opacity-0 translate-y-8 transition-all duration-700"
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="bg-white rounded-md px-4 py-1.5 text-sm text-slate-500 max-w-md">
                          schoolmule.ca/parent
                        </div>
                      </div>
                    </div>
                    <div className="relative aspect-video">
                      <Image
                        src="/images/ParentPortalScreenshot.png"
                        alt="SchoolMule Parent Portal"
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 - Attendance */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div
                  data-reveal
                  className="order-2 lg:order-1 opacity-0 translate-y-8 transition-all duration-700"
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="bg-white rounded-md px-4 py-1.5 text-sm text-slate-500 max-w-md">
                          schoolmule.ca/attendance
                        </div>
                      </div>
                    </div>
                    <div className="relative aspect-video">
                      <Image
                        src="/images/AttendanceScreenshot.png"
                        alt="SchoolMule Attendance"
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
                <div
                  data-reveal
                  className="order-1 lg:order-2 opacity-0 translate-y-8 transition-all duration-700"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium mb-4">
                    <ClockIcon className="w-4 h-4" />
                    Attendance Tracking
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    Never Miss a Beat
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Comprehensive attendance tracking with real-time analytics and automated parent notifications.
                  </p>
                  <ul className="space-y-4">
                    {['General & class-specific attendance', 'Automated absence alerts', 'Compliance report generation'].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="max-w-4xl mx-auto text-center opacity-0 translate-y-8 transition-all duration-700"
            >
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-8 h-8 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium text-slate-800 leading-relaxed mb-8">
                &ldquo;SchoolMule has transformed how we operate. What used to take our staff hours
                now happens with just a few clicks. Our teachers can focus on teaching,
                not administrative work.&rdquo;
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  SB
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Sarah Bennett</p>
                  <p className="text-slate-500">Principal, Maplewood Elementary</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

          {/* Decorative */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="max-w-3xl mx-auto text-center opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your School?
              </h2>
              <p className="text-lg lg:text-xl text-slate-300 mb-10 leading-relaxed">
                Join forward-thinking schools that have streamlined their operations with SchoolMule.
                Schedule a personalized demo or start your free trial today.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Schedule Demo
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Start Free Trial
                </Link>
              </div>

              <p className="text-slate-400">
                Questions? Contact us at{' '}
                <a href="mailto:schoolmule.official@gmail.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  schoolmule.official@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default WelcomePage
