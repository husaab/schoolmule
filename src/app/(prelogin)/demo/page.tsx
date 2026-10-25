import type { Metadata } from 'next'
import { Clock, FileText, PlayCircle, ShieldCheck } from 'lucide-react'
import CalendlyEmbed from '@/components/marketing/CalendlyEmbed'
import { FounderPortrait } from '@/components/marketing/FounderNote'
import JsonLd from '@/components/marketing/JsonLd'
import { ReportSamplesLink } from '@/components/marketing/ReportSamples'
import WatchFilmButton from '@/components/marketing/film/WatchFilmButton'
import { Tray } from '@/components/marketing/frames'
import { Accent, Container, H1, Lead } from '@/components/marketing/ui'
import { breadcrumbSchema, pageMetadata } from '@/lib/marketing/seo'
import { CONTACT_EMAIL, DEMO_MINUTES, FOUNDER } from '@/lib/marketing/site'

// Book a demo: the calendar books in a few taps, with two other doors for
// people not ready to talk (Ramp's three doors). The calendar is the existing
// Calendly event (lib/marketing/site CALENDLY_URL).

export const metadata: Metadata = pageMetadata({
  title: 'Book a demo',
  description: `Book a ${DEMO_MINUTES}-minute demo of SchoolMule with ${FOUNDER.name}, who builds it. Or watch the 1:41 tour and see sample report cards first.`,
  path: '/demo',
})

const STEPS = [
  'Tell us how your school runs today: your grades, your report cards, how families hear from you.',
  'See the parts that matter to you, on a demo school.',
  'Get a clear price for your school and what happens next.',
]

export default function DemoPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Book a demo', path: '/demo' }])} />
      <section aria-labelledby="demo-title" className="bg-gradient-to-b from-mist via-white to-white pb-24 pt-28 sm:pt-36 lg:pt-40">
        <Container className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_1fr]">
          <div className="grid gap-8 lg:col-start-1 lg:row-start-1">
            <div className="grid justify-items-start gap-6">
              <H1 id="demo-title" className="mk-lift text-[2.5rem] sm:text-[3.4rem] lg:text-[3.6rem]">
                Book a <Accent className="text-brand-ink">{DEMO_MINUTES}‑minute demo.</Accent>
              </H1>
              <Lead className="mk-rise mk-rise-2">
                You’ll talk with {FOUNDER.firstName}, who builds SchoolMule. Pick a time, and he’ll show you SchoolMule for a school like yours.
              </Lead>
            </div>

            <div className="mk-rise mk-rise-3 flex items-center gap-4">
              <FounderPortrait size="sm" />
              <div>
                <p className="font-semibold text-ink">{FOUNDER.name}</p>
                <p className="text-sm text-slate-600">Founder of SchoolMule</p>
              </div>
            </div>
          </div>

          <div className="mk-lift mk-rise-4 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Tray>
              <h2 className="sr-only">Pick a time</h2>
              <CalendlyEmbed />
            </Tray>
          </div>

          <div className="grid gap-8 lg:col-start-1 lg:row-start-2">

            <ol className="grid gap-4">
              {STEPS.map((s, i) => (
                <li key={s} className="grid grid-cols-[2rem_1fr] gap-3 leading-relaxed text-slate-700">
                  <span aria-hidden className="grid size-7 place-items-center rounded-full bg-white text-sm font-semibold text-ink ring-1 ring-hairline tabular-nums">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>

            <ul className="grid gap-3 border-t border-hairline pt-6 text-[0.95rem] text-slate-600">
              <li className="flex items-center gap-3">
                <Clock aria-hidden strokeWidth={1.75} className="size-5 text-brand-ink" />
                {DEMO_MINUTES} minutes, by video call
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck aria-hidden strokeWidth={1.75} className="size-5 text-brand-ink" />
                Your details only go to us. No mailing list.
              </li>
            </ul>

            <div className="grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
              <p className="font-semibold text-ink">Not ready to talk yet?</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="inline-flex items-center gap-2">
                  <PlayCircle aria-hidden strokeWidth={1.75} className="size-5 text-slate-400" />
                  <WatchFilmButton from="demo-page" variant="link" />
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileText aria-hidden strokeWidth={1.75} className="size-5 text-slate-400" />
                  <ReportSamplesLink from="demo-page" />
                </span>
              </div>
              <p className="text-[0.95rem] text-slate-600">
                Or email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-ink underline-offset-4 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
