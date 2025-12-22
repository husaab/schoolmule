'use client'

import { useEffect, useRef } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import Script from 'next/script'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  VideoCameraIcon,
  SparklesIcon,
  ArrowRightIcon
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

const demoFeatures = [
  { icon: CheckCircleIcon, text: 'Complete System Overview' },
  { icon: ChartBarIcon, text: 'Live Data Demonstration' },
  { icon: UserGroupIcon, text: 'Parent Portal Walkthrough' },
  { icon: DocumentTextIcon, text: 'Q&A with Our Experts' }
]

const keyFeatures = [
  { icon: UserGroupIcon, label: 'Student Management', color: 'text-cyan-600' },
  { icon: DocumentTextIcon, label: 'Report Cards', color: 'text-emerald-600' },
  { icon: ChartBarIcon, label: 'Analytics Dashboard', color: 'text-violet-600' },
  { icon: CalendarDaysIcon, label: 'Smart Scheduling', color: 'text-amber-600' }
]

export default function DemoPage() {
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
          <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm mb-6">
                <VideoCameraIcon className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-600">Personalized Demo</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                See SchoolMule{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  in Action
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Book a personalized 60-minute demonstration tailored to your school&apos;s specific needs.
                Our experts will show you exactly how SchoolMule can transform your operations.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Content Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left Column - Demo Info */}
              <div className="space-y-8">
                {/* What You'll See */}
                <div
                  data-reveal
                  className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 opacity-0 -translate-x-8 transition-all duration-700"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    What You&apos;ll See in Your Demo
                  </h2>
                  <ul className="space-y-5">
                    {demoFeatures.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{feature.text}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {feature.text === 'Complete System Overview' && 'See all core features and how they work together'}
                            {feature.text === 'Live Data Demonstration' && 'Watch real report card generation and grade calculations'}
                            {feature.text === 'Parent Portal Walkthrough' && 'See how parents interact with your school data'}
                            {feature.text === 'Q&A with Our Experts' && 'Get all your questions answered in real-time'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Demo Details Card */}
                <div
                  data-reveal
                  className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-8 border border-cyan-100 opacity-0 -translate-x-8 transition-all duration-700"
                  style={{ transitionDelay: '100ms' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <CalendarDaysIcon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Demo Details</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Duration', value: '60 minutes' },
                      { label: 'Format', value: 'Video call with screen sharing' },
                      { label: 'Customized', value: 'Tailored to your school size' },
                      { label: 'Follow-up', value: 'Implementation plan provided' }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-cyan-100 last:border-0">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-600">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Features Grid */}
                <div
                  data-reveal
                  className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 opacity-0 -translate-x-8 transition-all duration-700"
                  style={{ transitionDelay: '200ms' }}
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    Key Features You&apos;ll Experience
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {keyFeatures.map((feature) => (
                      <div key={feature.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                        <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Calendly Widget */}
              <div
                data-reveal
                className="opacity-0 translate-x-8 transition-all duration-700"
              >
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-100 sticky top-28">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Book Your Demo
                    </h2>
                    <p className="text-slate-600">Choose a time that works best for you</p>
                  </div>

                  <div
                    className="calendly-inline-widget rounded-xl overflow-hidden"
                    data-url="https://calendly.com/husseinsaab14/30min"
                    style={{ minWidth: '100%', height: '650px' }}
                  />
                  <Script
                    src="https://assets.calendly.com/assets/external/widget.js"
                    strategy="lazyOnload"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

          {/* Decorative blobs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="max-w-3xl mx-auto text-center opacity-0 translate-y-8 transition-all duration-700"
            >
              <SparklesIcon className="w-12 h-12 text-amber-400 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-lg lg:text-xl text-slate-300 mb-10 leading-relaxed">
                Join schools that have already streamlined their operations and improved parent engagement with SchoolMule.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Contact Sales
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
