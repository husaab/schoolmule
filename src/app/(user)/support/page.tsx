// File: src/app/(user)/support/page.tsx
'use client'

import React, { useState } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { sendSupportTicket, TicketPayload } from '@/services/emailService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

const issueOptions = [
  { label: 'Bug Report',      value: 'bug_report'     },
  { label: 'Feature Request', value: 'feature_request'},
  { label: 'Account Issue',   value: 'account_issue'  },
  { label: 'Other',           value: 'other'          },
]

export default function SupportPage() {
  const notify = useNotificationStore(s => s.showNotification)
  const [issueType, setIssueType]     = useState(issueOptions[0].value)
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const user = useUserStore(s => s.user)
  const [contactEmail, setContactEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload: TicketPayload = { username: user.username!, school: user.school!, issueType, description, contactEmail }
    try {
      const res = await sendSupportTicket(payload)
      if (res.success) {
        notify('Support ticket submitted!', 'success')
        setSubmitted(true)
      } else {
        notify(res.message || 'Failed to submit ticket', 'error')
      }
    } catch {
      notify('Error: ', 'error')
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
          <h1 className="text-2xl font-semibold mb-4 text-black">Help & Support</h1>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700">
                  What can we help you with?
                </label>
                <select
                  id="issueType"
                  value={issueType}
                  onChange={e => setIssueType(e.target.value)}
                  className="mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm p-2 focus:border-cyan-600 focus:ring focus:ring-cyan-200"
                >
                  {issueOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
                  {/* ← New email field */}
             <div>
               <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 text-black">
                 Your Email (so we can reach you)
               </label>
               <input
                 id="contactEmail"
                 type="email"
                required
                 value={contactEmail}
                 onChange={e => setContactEmail(e.target.value)}
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-cyan-600 focus:ring text-black"
                 placeholder='e.g. teacher@schoolmule.ca'
               />
             </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={6}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="mt-1 xl:h-70 text-black block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-cyan-600 focus:ring focus:ring-cyan-200"
                  placeholder='e.g. Mobile responsiveness issue'
                />
              </div>

              <button
                type="submit"
                className="inline-block w-full py-2 px-4 bg-cyan-600 cursor-pointer text-white font-semibold rounded-md transform transition duration-200 hover:bg-cyan-700 hover:scale-105"
              >
                Submit Ticket
              </button>

              <div className="mt-4 text-sm text-gray-700">
                <p>
                  Need urgent support? Please contact{' '}
                  <a href="https://wa.me/16475287842" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline transform transition duration-200 hover:scale-110">
                    647‑528‑7842
                  </a> via WhatsApp
                </p>
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <p className="text-green-600 text-lg">
                Thank you! Your support request has been received.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
