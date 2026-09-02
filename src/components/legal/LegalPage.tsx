'use client'

import { FC, ReactNode } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'

interface LegalPageProps {
  title: string
  /** Shown under the title, e.g. "Last updated 2 September 2026". */
  updated: string
  children: ReactNode
}

/**
 * Shared chrome for the legal documents (privacy, terms).
 *
 * These are read, not browsed, so they deliberately skip the scroll-reveal
 * animation the marketing pages use — content that fades in as you scroll is
 * hostile when someone is trying to find one clause.
 */
const LegalPage: FC<LegalPageProps> = ({ title, updated, children }) => (
  <>
    <PreNavBar />
    <main className="bg-white">
      <header className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-16 lg:py-20">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-3">{updated}</p>
        </div>
      </header>

      {/* `prose`-like spacing written out, since the project has no typography plugin. */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12 lg:py-16
                      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-3
                      [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2
                      [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:mb-4
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
                      [&_li]:text-slate-600 [&_li]:leading-relaxed
                      [&_a]:text-cyan-600 [&_a]:underline hover:[&_a]:text-cyan-700
                      [&_strong]:text-slate-900 [&_strong]:font-semibold">
        {children}
      </div>
    </main>
    <Footer />
  </>
)

export default LegalPage
