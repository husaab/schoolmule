'use client'

// Finance → Payments (finance permission). Where a school connects its own
// Stripe account so families can pay it online. The school signs up on
// Stripe's hosted pages; Stripe sends it back here with `?stripe=return`
// (the form was left, finished or not) or `?stripe=refresh` (the link had
// expired, so a new one is fetched and followed straight away).

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { CreditCardIcon, ExclamationTriangleIcon, LinkSlashIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useUserStore } from '@/store/useUserStore'
import { can } from '@/lib/permissions'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useFilterParams } from '@/hooks/useFilterParams'
import { createStripeOnboardingLink, disconnectPayments, getPaymentsConnection, syncPaymentsAccount } from '@/services/paymentsService'
import type { PaymentsConnection } from '@/services/types/payments'
import { connectionState, returnMessage } from '@/lib/paymentsConnection'
import StripeConnectionCard from '@/components/payments/StripeConnectionCard'
import PaymentsCostCard from '@/components/payments/PaymentsCostCard'
import PaymentsLedger from '@/components/payments/PaymentsLedger'
import ConfirmActionModal, { type ConfirmRequest } from '@/components/finance/ConfirmActionModal'
import { errorMessage } from '@/components/finance/format'

const secondaryButton =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

const READY_LIST = [
  'Your school’s legal name and business or charity number',
  'A director’s name, date of birth and home address',
  'The bank account payouts should go to',
]

function PaymentsContent() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  // `stripe` is a one-off signal from Stripe's redirect, never a filter to remember.
  const { get, setParams } = useFilterParams({ remember: false })

  // AuthGuard redirects anyone without the permission, but not before the
  // first render, so gate the requests on it too.
  const ready = !!user.id && can(user, 'finance')

  const [connection, setConnection] = useState<PaymentsConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await getPaymentsConnection()
      setConnection(res.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load payments'))
    } finally {
      setLoading(false)
    }
  }, [])

  /** Sends the browser to Stripe's sign-up. Stays "connecting" until the page unloads. */
  const openStripe = useCallback(async () => {
    setConnecting(true)
    try {
      const res = await createStripeOnboardingLink()
      window.location.href = res.data.url
    } catch (err) {
      showNotification(errorMessage(err, 'Could not open Stripe'), 'error')
      setConnecting(false)
    }
  }, [showNotification])

  const checkAgain = useCallback(async (announce: boolean) => {
    setChecking(true)
    try {
      const res = await syncPaymentsAccount()
      setConnection((prev) => (prev ? { ...prev, account: res.data.account } : prev))
      if (announce) showNotification(...returnMessage(res.data.account))
    } catch (err) {
      showNotification(errorMessage(err, 'Could not check with Stripe'), 'error')
    } finally {
      setChecking(false)
    }
  }, [showNotification])

  // Back from Stripe can restore this page from the browser's cache exactly as
  // it was left, button disabled. Put it back.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setConnecting(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  // First load, then act once on how Stripe sent the school back.
  const stripeParam = get('stripe')
  const handled = useRef(false)
  useEffect(() => {
    if (!ready || handled.current) return
    handled.current = true
    const outcome = stripeParam
    if (outcome) setParams({ stripe: null })
    ;(async () => {
      await load()
      if (outcome === 'return') await checkAgain(true)
      else if (outcome === 'refresh') await openStripe()
    })()
  }, [ready, stripeParam, setParams, load, checkAgain, openStripe])

  const askDisconnect = () => setConfirm({
    title: 'Turn off payments?',
    subtitle: connection?.account?.displayName ?? undefined,
    icon: LinkSlashIcon,
    tone: 'danger',
    message: 'SchoolMule will stop taking online payments for your school.',
    consequences: {
      title: 'What happens',
      items: [
        'Families can no longer pay your school online through SchoolMule',
        'Your Stripe account, its balance and its payouts are not touched',
        'You can reconnect at any time and pick up the same Stripe account',
      ],
    },
    confirmLabel: 'Turn off payments',
    onConfirm: async () => {
      const res = await disconnectPayments()
      setConnection((prev) => (prev ? { ...prev, account: res.data.account } : prev))
      showNotification('Payments are turned off', 'success')
    },
  })

  const state = connectionState(connection)
  const beforeActive = state === 'not_connected' || state === 'onboarding'

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )
    }
    if (error) {
      return (
        <EmptyState
          icon={ExclamationTriangleIcon}
          iconClassName="text-rose-300"
          title="Could not load payments"
          description={error}
          action={
            <button type="button" onClick={() => { setLoading(true); load() }} className={secondaryButton}>
              Try again
            </button>
          }
        />
      )
    }
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StripeConnectionCard
            connection={connection}
            connecting={connecting}
            checking={checking}
            onConnect={openStripe}
            onCheck={() => checkAgain(false)}
            onDisconnect={askDisconnect}
          />
        </div>
        <div className="flex flex-col gap-5">
          <PaymentsCostCard />
          {beforeActive && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Have these ready</h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
                {READY_LIST.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Stripe checks names against the government registry, so enter them exactly as registered.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 lg:p-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <CreditCardIcon className="h-7 w-7 text-cyan-500" />
              Payments
            </h1>
            <p className="mt-1 text-slate-500">
              Collect trip fees, book money and other payments online. Money goes straight to your school’s bank account.
            </p>
          </div>
          {renderBody()}
          {!loading && !error && connection?.configured && (
            <PaymentsLedger stripeConnected={Boolean(connection.account && connection.account.status !== 'disconnected')} />
          )}
        </div>
      </main>
      <ConfirmActionModal request={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <PaymentsContent />
    </Suspense>
  )
}
