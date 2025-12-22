'use client'
import { FC, useEffect, useRef } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  UserGroupIcon,
  HeartIcon,
  LightBulbIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon, CheckIcon } from '@heroicons/react/24/solid'

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

const values = [
  {
    icon: LightBulbIcon,
    title: 'Simplicity',
    description: 'Complex problems deserve simple solutions. We prioritize intuitive design over feature bloat.',
    color: 'from-amber-400 to-orange-500'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Security',
    description: 'Student data is sacred. Enterprise-grade security and FERPA compliance are non-negotiable.',
    color: 'from-cyan-400 to-teal-500'
  },
  {
    icon: HeartIcon,
    title: 'Community',
    description: 'Schools are communities. Our software strengthens connections between students, parents, and educators.',
    color: 'from-rose-400 to-pink-500'
  }
]

const stats = [
  { value: '50+', label: 'Schools Served' },
  { value: '10,000+', label: 'Students Managed' },
  { value: '99.9%', label: 'Uptime Record' },
  { value: '24/7', label: 'Support Available' }
]

const testimonials = [
  {
    quote: "SchoolMule has completely transformed our administrative workflow. What used to take our staff 3 hours now takes 20 minutes.",
    author: 'Sarah Bennett',
    role: 'Principal, Maplewood Elementary',
    initials: 'SB'
  },
  {
    quote: "The parent portal has revolutionized our parent engagement. Parents love having real-time access to their child's progress.",
    author: 'Michael Rodriguez',
    role: 'Administrator, St. Mary\'s Academy',
    initials: 'MR'
  }
]

const securityFeatures = [
  { label: 'FERPA Compliant', description: 'Full compliance with educational privacy laws' },
  { label: 'SSL Encryption', description: '256-bit encryption for all data' },
  { label: 'Role-Based Access', description: 'Granular user permissions' },
  { label: 'Daily Backups', description: 'Automated with 99.9% uptime' }
]

const AboutPage: FC = () => {
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
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm mb-6">
                <AcademicCapIcon className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-600">Built by Educators, for Educators</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Trusted by Schools{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Nationwide
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                SchoolMule was founded by educators who understand the daily challenges of school administration.
                We&apos;re committed to building software that truly serves the education community.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div
                data-reveal
                className="opacity-0 -translate-x-8 transition-all duration-700"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium mb-6">
                  <SparklesIcon className="w-4 h-4" />
                  Our Mission
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Eliminating Administrative Burden from Education
                </h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  We believe technology should simplify, not complicate, the educational process.
                  Every hour saved on paperwork is an hour that can be spent with students.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Founded in 2025 by former educators and technology experts, SchoolMule emerged from
                  real-world experience with the frustrations of disconnected school management systems.
                </p>
              </div>

              <div
                data-reveal
                className="opacity-0 translate-x-8 transition-all duration-700"
              >
                <div className="relative">
                  <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 bg-gradient-to-br from-cyan-50 to-teal-50">
                    <div className="flex items-center justify-center mb-8">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <AcademicCapIcon className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 text-center mb-4">
                      Education First
                    </h3>
                    <p className="text-slate-600 text-center leading-relaxed">
                      Every feature is designed with educators&apos; real needs in mind,
                      not just technical possibilities.
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 lg:py-28 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Our Core Values</h2>
              <p className="text-lg text-slate-600">The principles that guide every decision we make</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  data-reveal
                  className="group relative p-8 bg-white rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-300 text-center opacity-0 translate-y-8"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 lg:p-16 text-white shadow-2xl opacity-0 translate-y-8 transition-all duration-700"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <ShieldCheckIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                    Security & Compliance
                  </h2>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    Your data security is our highest priority. We implement enterprise-grade
                    security measures to protect sensitive student information.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {securityFeatures.map((feature) => (
                    <div key={feature.label} className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <h4 className="font-semibold text-white mb-2">{feature.label}</h4>
                      <p className="text-sm text-slate-400">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 lg:py-28 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">What Schools Are Saying</h2>
              <p className="text-lg text-slate-600">Real feedback from real educators</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.author}
                  data-reveal
                  className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 opacity-0 translate-y-8 transition-all duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-slate-700 mb-6 leading-relaxed italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{testimonial.author}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              data-reveal
              className="text-center mb-12 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                SchoolMule by the Numbers
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  data-reveal
                  className="text-center opacity-0 translate-y-8 transition-all duration-700"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-cyan-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="text-center max-w-3xl mx-auto mb-16 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Meet Our Team</h2>
              <p className="text-lg text-slate-600">Educators and technologists working together</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Education Experts',
                  description: 'Former principals, teachers, and administrators who understand school operations',
                  icon: AcademicCapIcon,
                  color: 'bg-cyan-50',
                  iconColor: 'text-cyan-600'
                },
                {
                  title: 'Technology Leaders',
                  description: 'Senior engineers from top tech companies, specializing in education software',
                  icon: LightBulbIcon,
                  color: 'bg-amber-50',
                  iconColor: 'text-amber-600'
                },
                {
                  title: 'Customer Success',
                  description: 'Dedicated support team available to help your school succeed with SchoolMule',
                  icon: UserGroupIcon,
                  color: 'bg-violet-50',
                  iconColor: 'text-violet-600'
                }
              ].map((item, index) => (
                <div
                  key={item.title}
                  data-reveal
                  className="group relative p-8 bg-white rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-300 text-center opacity-0 translate-y-8"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-20 h-20 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-6`}>
                    <item.icon className={`w-10 h-10 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="bg-white rounded-3xl p-10 lg:p-16 text-center shadow-xl border border-slate-100 opacity-0 translate-y-8 transition-all duration-700"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Ready to Join Our Growing Community?
              </h2>
              <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                Experience the difference that purpose-built school management software can make.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Schedule Demo
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-300"
                >
                  Contact Us
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

export default AboutPage
