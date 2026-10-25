import type { Metadata } from 'next'
import CtaBand from '@/components/marketing/CtaBand'
import FounderNote from '@/components/marketing/FounderNote'
import JsonLd from '@/components/marketing/JsonLd'
import { Accent, Container, H1, H2, Lead, Section } from '@/components/marketing/ui'
import { breadcrumbSchema, pageMetadata } from '@/lib/marketing/seo'
import { CONTACT_EMAIL, FOUNDER, USAGE_CLAIM } from '@/lib/marketing/site'

// Only facts that can be checked. The founding story, the year and any
// team members wait until the founder writes them (plan.md §7).

export const metadata: Metadata = pageMetadata({
  title: 'About SchoolMule',
  description: `SchoolMule is school management for small independent schools in Ontario, built by ${FOUNDER.name}. ${USAGE_CLAIM}.`,
  path: '/about',
})

const WAYS = [
  {
    title: 'You talk to the person who builds it',
    text: `Your demo is with ${FOUNDER.firstName}, and so is the conversation after it. Questions go to someone who can change the product.`,
  },
  {
    title: 'Built with the schools that use it',
    text: 'SchoolMule grows from what principals, teachers and parents at real schools ask for, and improvements ship every week.',
  },
  {
    title: 'Made for schools your size',
    text: 'Not a district system cut down, and not a newsletter app built up: one system shaped around a school of 30 to 200 students.',
  },
]

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'About', path: '/about' }])} />

      <section aria-labelledby="about-title" className="bg-gradient-to-b from-mist via-white to-white pb-8 pt-28 sm:pt-36 lg:pt-40">
        <Container>
          <div className="grid max-w-3xl justify-items-start gap-6">
            <H1 id="about-title" className="mk-lift">
              Built for schools <Accent className="text-brand-ink">like yours.</Accent>
            </H1>
            <Lead className="mk-rise mk-rise-2">
              SchoolMule is school management for small independent schools in Ontario: the office, the classroom and home, on one set of records.
            </Lead>
          </div>
        </Container>
      </section>

      <Section labelledBy="why-title" className="pt-12 sm:pt-16">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <H2 id="why-title">Why small schools.</H2>
          <div className="grid max-w-2xl gap-5 text-lg leading-relaxed text-slate-600">
            <p>
              Ontario has more than 1,400 independent schools, and most of them are small. Cardus counted at least 1,445 in 2019–20, teaching over 154,000 students, or about 107 students per school on average (
              <a
                href="https://old.cardus.ca/news/news-releases/number-of-independent-schools-in-ontario-up-52-since-2013"
                className="font-semibold text-brand-ink underline-offset-4 hover:underline"
                rel="noopener"
                target="_blank"
              >
                Cardus
              </a>
              ). Another 322 opened between 2022 and 2025, and most of those are small too (
              <a
                href="https://cp24.com/local/toronto/2026/07/18/if-the-gta-population-is-up-why-are-public-school-numbers-down"
                className="font-semibold text-brand-ink underline-offset-4 hover:underline"
                rel="noopener"
                target="_blank"
              >
                CP24
              </a>
              ).
            </p>
            <p>
              In a school that size, the principal is often also the registrar and the person who puts the report cards together. The big school systems are built for districts, and the simple apps only cover one job. SchoolMule is the one system in between: attendance, grades, report cards and parent messages, with a view for each person in the school.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="mist" labelledBy="founder-about-title">
        <Container className="grid max-w-4xl gap-8">
          <h2 id="founder-about-title" className="sr-only">
            Who builds SchoolMule
          </h2>
          <FounderNote quote="I build SchoolMule, and I work with every school directly: setting up your classes, your report card and your staff. When something isn’t right, you email me." />
          <p className="text-slate-600">
            {USAGE_CLAIM}. Write to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-ink underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Container>
      </Section>

      <Section labelledBy="how-title">
        <Container>
          <H2 id="how-title" className="mb-12 max-w-3xl">
            How we work.
          </H2>
          <dl className="grid gap-x-10 gap-y-12 md:grid-cols-3">
            {WAYS.map((w) => (
              <div key={w.title} className="grid content-start gap-2 border-t-2 border-brand pt-5">
                <dt className="text-xl font-semibold leading-snug text-ink">{w.title}</dt>
                <dd className="leading-relaxed text-slate-600">{w.text}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <CtaBand from="about" />
    </>
  )
}
