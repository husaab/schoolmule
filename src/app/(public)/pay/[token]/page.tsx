import { Suspense } from 'react'
import PaymentLinkPage from '@/components/registration/PublicForm/PaymentLinkPage'

// A family's payment link (/pay/<token>): what they owe or paid for a form,
// and the way back to Stripe. Stripe sends families here after paying
// (?session_id=…) or leaving its page (?cancelled=1). The static `pay`
// segment wins over the [schoolSlug] route.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentLinkPage />
    </Suspense>
  )
}
