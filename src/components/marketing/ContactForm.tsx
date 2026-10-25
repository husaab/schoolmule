'use client'
import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { sendContactForm, type ContactPayload } from '@/services/emailService'
import { CONTACT_EMAIL } from '@/lib/marketing/site'
import { trackEvent } from './film/filmEvents'
import { ArrowDisc, buttonStyles, cx } from './ui'

// The contact form: POST /api/email/contact through services/emailService,
// with the honeypot field the backend expects bots to fill. Errors show in
// the form itself (the website has no notification tray).

const field =
  'w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink shadow-[0_1px_2px_rgba(11,19,36,0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Bots fill the hidden field; "succeed" quietly so they don't retry.
    if (website) {
      setStatus('sent')
      return
    }
    setStatus('sending')
    setError('')
    const payload: ContactPayload = { name, email, message }
    try {
      const res = await sendContactForm(payload)
      if (res.success) {
        setStatus('sent')
        trackEvent('contact_sent')
      } else {
        setStatus('error')
        setError(res.message || 'Your message wasn’t sent.')
      }
    } catch {
      setStatus('error')
      setError('Your message wasn’t sent.')
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="grid justify-items-start gap-3 py-6">
        <CheckCircle2 aria-hidden strokeWidth={1.75} className="size-9 text-brand-ink" />
        <p className="text-2xl font-semibold tracking-[-0.02em] text-ink">Message sent.</p>
        <p className="leading-relaxed text-slate-600">Thanks, {name.split(' ')[0] || 'and talk soon'}. We’ll reply to {email || 'you'} by email.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate={false}>
      <div className="grid gap-2">
        <label htmlFor="contact-name" className="font-medium text-ink">
          Your name
        </label>
        <input id="contact-name" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="contact-email" className="font-medium text-ink">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="contact-message" className="font-medium text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your school, how many students, and what you’d like to know."
          className={cx(field, 'resize-y')}
        />
      </div>
      {/* Honeypot: hidden from people and screen readers. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {status === 'error' && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-rose-800 ring-1 ring-rose-200">
          {error} Try again, or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      )}
      <button type="submit" disabled={status === 'sending'} className={cx(buttonStyles.primary, 'w-full disabled:opacity-60 sm:w-fit')}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
        <ArrowDisc />
      </button>
    </form>
  )
}
