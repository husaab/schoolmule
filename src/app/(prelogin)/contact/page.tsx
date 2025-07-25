// File: src/app/contact/page.tsx
'use client'
import { FC, useState } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { sendContactForm, ContactPayload } from '@/services/emailService'
import { useNotificationStore } from '@/store/useNotificationStore'

const ContactPage: FC = () => {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [message, setMessage]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const notify = useNotificationStore(s => s.showNotification)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() 

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
      notify('Error sending message: ', 'error')
    }
  }

  return (
    <>
      <PreNavBar />
      <main className="font-sans bg-white text-gray-800 py-45 px-6 lg:px-20 min-h-screen">
        <section className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center">Contact Us</h1>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-lg font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-lg font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={8}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition cursor-pointer"
              >
                Send Message
              </button>
            </form>
          ) : (
            <div className="text-center py-12">
              <p className="text-green-600 font-medium text-lg">
                Thank you, {name}! Your message has been received.
              </p>
            </div>
          )}

          <div className="pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold">Other ways to reach us</h2>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:schoolmule@gmail.com" className="text-blue-600 hover:underline">
                schoolmule@gmail.com
              </a>
            </p>
            <p>
              <strong>Phone:</strong> (647) 528-7842
            </p>
            <p>
              <strong>Address:</strong> 123 Education St., Toronto, ON, Canada
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ContactPage
