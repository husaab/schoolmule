import { Suspense } from 'react'
import { Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import WebsiteRedirect from '@/components/landing/WebsiteRedirect'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import MarketingProviders from '@/components/marketing/MarketingProviders'
import JsonLd from '@/components/marketing/JsonLd'
import { organizationSchema } from '@/lib/marketing/seo'

// The film's accent face, loaded only for the website.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-instrument-serif',
  display: 'swap',
})

// The marketing website. Signed-in users who arrive here go to their home
// page (lib/websiteVisit); useSearchParams needs the Suspense.
export default function PreloginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mk ${instrumentSerif.variable} bg-white`}>
      <Suspense fallback={null}>
        <WebsiteRedirect />
      </Suspense>
      <JsonLd data={organizationSchema} />
      <MarketingProviders>
        <NavBar />
        <main id="main">{children}</main>
        <Footer />
      </MarketingProviders>
      <Analytics />
    </div>
  )
}
