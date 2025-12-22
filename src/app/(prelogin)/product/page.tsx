'use client'
import { FC, useEffect, useRef } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CpuChipIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0', 'translate-x-0')
            entry.target.classList.remove('opacity-0', 'translate-y-8', '-translate-x-8', 'translate-x-8')
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
    id: 'students',
    icon: UserGroupIcon,
    badge: 'Student Management',
    badgeColor: 'bg-cyan-50 text-cyan-700',
    title: 'Complete Student Information System',
    description: 'Complete student lifecycle management from enrollment to graduation.',
    image: '/images/StudentInterface.png',
    imageAlt: 'SchoolMule Student Management Interface',
    highlights: [
      'Comprehensive profiles with demographics and contacts',
      'Family management for multi-child families',
      'Bulk enrollment and class assignments',
      'Historical tracking across years'
    ]
  },
  {
    id: 'gradebook',
    icon: ChartBarIcon,
    badge: 'Smart Gradebook',
    badgeColor: 'bg-emerald-50 text-emerald-700',
    title: 'Advanced Gradebook System',
    description: 'Sophisticated grade calculation with flexible weighting and standards-based grading.',
    image: '/images/GradebookScreenshot.png',
    imageAlt: 'SchoolMule Advanced Gradebook',
    highlights: [
      'Weighted assessment categories',
      'Real-time grade calculations',
      'Multi-term support (semester, trimester)',
      'Grade analytics and trend identification'
    ]
  },
  {
    id: 'reports',
    icon: DocumentTextIcon,
    badge: 'Report Cards',
    badgeColor: 'bg-violet-50 text-violet-700',
    title: 'Automated Report Card Generation',
    description: 'Professional PDF report cards generated automatically with teacher feedback integration.',
    image: '/images/ReportCardScreenshot.png',
    imageAlt: 'SchoolMule Report Card Generator',
    highlights: [
      'One-click PDF generation',
      'Teacher feedback integration',
      'Custom school branding',
      'Digital parent portal access'
    ]
  },
  {
    id: 'attendance',
    icon: ClockIcon,
    badge: 'Attendance',
    badgeColor: 'bg-amber-50 text-amber-700',
    title: 'Smart Attendance Management',
    description: 'Comprehensive attendance tracking with real-time analytics and automated reporting.',
    image: '/images/AttendanceScreenshot.png',
    imageAlt: 'SchoolMule Attendance Dashboard',
    highlights: [
      'General and class-specific tracking',
      'Real-time analytics dashboard',
      'Automated parent notifications',
      'State compliance reports'
    ]
  },
  {
    id: 'finance',
    icon: CurrencyDollarIcon,
    badge: 'Financial',
    badgeColor: 'bg-rose-50 text-rose-700',
    title: 'Integrated Financial Management',
    description: 'Complete tuition and payment management with automated invoicing.',
    image: '/images/TuitionScreenshot.png',
    imageAlt: 'SchoolMule Financial Dashboard',
    highlights: [
      'Flexible payment plans',
      'Automated invoice generation',
      'Real-time payment tracking',
      'Revenue analytics'
    ]
  }
]

const technicalSpecs = {
  requirements: [
    { title: 'Browser Support', value: 'Chrome 90+, Firefox 88+, Safari 14+, Edge 90+' },
    { title: 'Network Requirements', value: 'Minimum 1 Mbps per user' },
    { title: 'Device Compatibility', value: 'Desktop, tablet, mobile responsive' },
    { title: 'Operating Systems', value: 'Windows, macOS, Linux, iOS, Android' }
  ],
  performance: [
    { title: 'Response Time', value: '< 200ms average' },
    { title: 'Concurrent Users', value: 'Unlimited with auto-scaling' },
    { title: 'Data Storage', value: 'Unlimited with backups' },
    { title: 'Uptime Guarantee', value: '99.9% SLA' }
  ]
}

const securityFeatures = [
  {
    title: 'Data Protection',
    items: ['256-bit AES encryption', 'SSL/TLS 1.3 transport', 'End-to-end protection', 'Encrypted at rest']
  },
  {
    title: 'Access Control',
    items: ['Role-based permissions', 'Multi-factor auth', 'Session management', 'Audit logging']
  },
  {
    title: 'Compliance',
    items: ['FERPA compliant', 'COPPA compliant', 'Regular security audits']
  }
]

const implementationSteps = [
  { step: 1, title: 'Initial Setup', description: 'School configuration and user accounts', duration: '1-2 days', color: 'from-cyan-400 to-cyan-600' },
  { step: 2, title: 'Data Migration', description: 'Import existing student and staff data', duration: '1-2 days', color: 'from-teal-400 to-teal-600' },
  { step: 3, title: 'Training', description: 'Staff training and documentation', duration: '1 week', color: 'from-violet-400 to-violet-600' },
  { step: 4, title: 'Go Live', description: 'Full launch with ongoing support', duration: 'Day 14', color: 'from-amber-400 to-amber-600' }
]

const ProductPage: FC = () => {
  const containerRef = useScrollReveal()

  return (
    <div ref={containerRef} className="bg-white">
      <PreNavBar />

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 via-white to-slate-50" />

          {/* Decorative blobs */}
          <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm mb-6">
                <CpuChipIcon className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-600">Full Technical Overview</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Powerful Features,{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Beautiful Design
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Discover the comprehensive features and technical specifications that make
                SchoolMule the most advanced school management platform available.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Deep Dives */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className="mb-24 lg:mb-32 last:mb-0"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center`}>
                  {/* Content */}
                  <div
                    data-reveal
                    className={`${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'} opacity-0 ${index % 2 === 0 ? '-translate-x-8' : 'translate-x-8'} transition-all duration-700`}
                  >
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${feature.badgeColor} text-sm font-medium mb-6`}>
                      <feature.icon className="w-4 h-4" />
                      {feature.badge}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-4">
                      {feature.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckIcon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-slate-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot */}
                  <div
                    data-reveal
                    className={`${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'} opacity-0 ${index % 2 === 0 ? 'translate-x-8' : '-translate-x-8'} transition-all duration-700`}
                  >
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
                            schoolmule.ca/{feature.id}
                          </div>
                        </div>
                      </div>
                      {/* Screenshot */}
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={feature.image}
                          alt={feature.imageAlt}
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="py-20 lg:py-28 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Technical Specifications</h2>
              <p className="text-lg text-slate-600">Enterprise-grade requirements and capabilities</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* System Requirements */}
              <div
                data-reveal
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 opacity-0 translate-y-8 transition-all duration-700"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <CpuChipIcon className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    System Requirements
                  </h3>
                </div>
                <div className="space-y-4">
                  {technicalSpecs.requirements.map((spec) => (
                    <div key={spec.title} className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-semibold text-slate-800 mb-1">{spec.title}</h4>
                      <p className="text-sm text-slate-600">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance */}
              <div
                data-reveal
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: '100ms' }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <RocketLaunchIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Performance & Scalability
                  </h3>
                </div>
                <div className="space-y-4">
                  {technicalSpecs.performance.map((spec) => (
                    <div key={spec.title} className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-semibold text-slate-800 mb-1">{spec.title}</h4>
                      <p className="text-sm text-slate-600">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Security & Compliance
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Enterprise-grade security for sensitive education data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {securityFeatures.map((category, index) => (
                <div
                  key={category.title}
                  data-reveal
                  className="bg-white/5 rounded-2xl p-8 border border-white/10 opacity-0 translate-y-8 transition-all duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <h3 className="text-lg font-bold text-white mb-6">
                    {category.title}
                  </h3>
                  <ul className="space-y-3">
                    {category.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-300">
                        <CheckIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Implementation Timeline */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Implementation Process</h2>
              <p className="text-lg text-slate-600">Simple, guided setup with expert support</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {implementationSteps.map((step, index) => (
                <div
                  key={step.step}
                  data-reveal
                  className="text-center opacity-0 translate-y-8 transition-all duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <span className="text-3xl font-bold text-white">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">{step.description}</p>
                  <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-500">
                    {step.duration}
                  </span>
                </div>
              ))}
            </div>

            <div
              data-reveal
              className="mt-16 text-center opacity-0 translate-y-8 transition-all duration-700"
            >
              <div className="inline-block px-6 py-3 bg-emerald-50 rounded-xl">
                <p className="text-lg font-semibold text-emerald-800">
                  Total Implementation Time: <span className="text-emerald-600">~1.5 weeks</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-20 lg:py-28 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Integration Capabilities</h2>
              <p className="text-lg text-slate-600">Connect with your existing systems</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div
                data-reveal
                className="group relative p-8 bg-white rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-300 text-center opacity-0 translate-y-8"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <DocumentTextIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Data Export
                </h3>
                <p className="text-slate-600">CSV, Excel, and PDF export capabilities for all your data</p>
              </div>

              <div
                data-reveal
                className="group relative p-8 bg-white rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-300 text-center opacity-0 translate-y-8"
                style={{ transitionDelay: '100ms' }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-6">
                  <ArrowPathIcon className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Data Sync
                </h3>
                <p className="text-slate-600">Real-time or scheduled data synchronization options</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ongoing Support & Training
              </h2>
              <p className="text-lg text-cyan-100">We&apos;re here to ensure your success</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div
                data-reveal
                className="bg-white/10 rounded-2xl p-8 border border-white/20 opacity-0 translate-y-8 transition-all duration-700"
              >
                <h3 className="text-xl font-bold text-white mb-6">Support Options</h3>
                <ul className="space-y-4">
                  {['24/7 email support', 'Phone support during business hours', 'Live chat assistance', 'Screen sharing sessions'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-cyan-50">
                      <CheckIcon className="w-5 h-5 text-cyan-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                data-reveal
                className="bg-white/10 rounded-2xl p-8 border border-white/20 opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: '100ms' }}
              >
                <h3 className="text-xl font-bold text-white mb-6">Training Resources</h3>
                <ul className="space-y-4">
                  {['Video tutorial library', 'Live training webinars', 'Comprehensive documentation', 'On-site training available'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-cyan-50">
                      <CheckIcon className="w-5 h-5 text-cyan-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="bg-white rounded-3xl p-10 lg:p-16 text-center shadow-xl border border-slate-100 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Ready to See SchoolMule in Action?
              </h2>
              <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                Schedule a personalized demo to see how SchoolMule can transform your school&apos;s operations.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Schedule Technical Demo
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-300"
                >
                  Contact Sales Team
                </Link>
              </div>
              <p className="mt-8 text-sm text-slate-500">
                Questions about technical requirements?{' '}
                <Link href="/contact" className="text-cyan-600 hover:text-cyan-700 underline">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProductPage
