// File: src/app/(user)/contact-us/page.tsx
'use client'

import React, { useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { sendContactForm, ContactPayload } from '@/services/emailService'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function ContactUsPage() {
  const notify = useNotificationStore(s => s.showNotification)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload: ContactPayload = { name, email, message }
    try {
      const res = await sendContactForm(payload)
      if (res.success) {
        notify('Message sent successfully!', 'success')
        setSubmitted(true)
      } else {
        notify(res.message || 'Failed to send message', 'error')
      }
    } catch (err: any) {
      notify('Error sending message: ' + err.message, 'error')
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
          <h1 className="text-2xl font-semibold mb-2 text-black">Contact Us</h1>
            <p className="mb-6 text-black text-sm">
                This is for general contact, for support please go to the  <a href='/support' className='underline text-blue-500'>support page</a> 
            </p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-cyan-600 focus:ring focus:ring-cyan-200"
                />
              </div>

              <div>
                <label htmlFor="email" className=" text-blackblock text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 block text-black w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-cyan-600 focus:ring focus:ring-cyan-200"
                  placeholder='e.g. teacher@schoolmule.ca'
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="mt-1 block text-black w-full rounded-md border-gray-300 shadow-sm p-2 xl:h-70 focus:border-cyan-600 focus:ring focus:ring-cyan-200"
                />
              </div>

              <button
                type="submit"
                className="cursor-pointer w-full py-2 px-4 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition"
              >
                Send Message
              </button>
            </form>
          ) : (
            <div className="text-center py-12">
              <p className="text-green-600 text-lg">
                Thank you, {name}! Your message has been received.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}