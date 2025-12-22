'use client'
import { FC, useState, useEffect, useRef } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { sendContactForm, ContactPayload } from '@/services/emailService'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PaperAirplaneIcon
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

const ContactPage: FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const notify = useNotificationStore(s => s.showNotification)
  const containerRef = useScrollReveal()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const payload: ContactPayload = { name, email, message }
    try {
      const res = await sendContactForm(payload)
      if (res.success) {
        notify('Email has been sent!', 'success')
        setSubmitted(true)
      } else {
        notify(res.message || 'Failed to send contact email', 'error')
      }
    } catch {
      notify('Error sending message', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="bg-white">
      <PreNavBar />

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 via-white to-slate-50" />

          {/* Decorative blobs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-24 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm mb-6">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-600">Get in Touch</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                We&apos;d Love to{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Hear From You
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Have a question about SchoolMule? Need help getting started?
                Our team is here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
                {/* Contact Info */}
                <div
                  data-reveal
                  className="lg:col-span-2 opacity-0 -translate-x-8 transition-all duration-700"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Contact Information
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Fill out the form and our team will get back to you within 24 hours.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                        <EnvelopeIcon className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">Email Us</h3>
                        <a
                          href="mailto:schoolmule.official@gmail.com"
                          className="text-cyan-600 hover:text-cyan-700 transition-colors"
                        >
                          schoolmule.official@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">Response Time</h3>
                        <p className="text-slate-600">Within 24 business hours</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Benefits */}
                  <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
                    <h3 className="font-semibold text-slate-800 mb-4">Why Contact Us?</h3>
                    <ul className="space-y-3">
                      {[
                        'Get a personalized demo',
                        'Ask about pricing & plans',
                        'Technical support questions',
                        'Partnership opportunities'
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                          <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Form */}
                <div
                  data-reveal
                  className="lg:col-span-3 opacity-0 translate-x-8 transition-all duration-700"
                >
                  <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-lg border border-slate-100">
                    {!submitted ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                            Full Name
                          </label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="John Smith"
                            className="w-full px-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                            Email Address
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="john@school.edu"
                            className="w-full px-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                            Your Message
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            rows={6}
                            required
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Tell us how we can help you..."
                            className="w-full px-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <PaperAirplaneIcon className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                          <CheckIcon className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">
                          Message Sent!
                        </h3>
                        <p className="text-lg text-slate-600 mb-2">
                          Thank you, {name}!
                        </p>
                        <p className="text-slate-500">
                          We&apos;ll get back to you within 24 hours.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
