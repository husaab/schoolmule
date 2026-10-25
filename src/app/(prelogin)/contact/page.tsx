import type { Metadata } from 'next'
import ContactForm from '@/components/marketing/ContactForm'
import DemoLink from '@/components/marketing/DemoLink'
import JsonLd from '@/components/marketing/JsonLd'
import { Tray } from '@/components/marketing/frames'
import { Accent, Container, H1, Lead } from '@/components/marketing/ui'
import { breadcrumbSchema, pageMetadata } from '@/lib/marketing/seo'
import { CONTACT_EMAIL, DEMO_MINUTES } from '@/lib/marketing/site'

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description: 'Ask SchoolMule anything: pricing for your school, switching from what you use now, or how something works.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Contact', path: '/contact' }])} />
      <section aria-labelledby="contact-title" className="bg-gradient-to-b from-mist via-white to-white pb-24 pt-28 sm:pt-36 lg:pt-40">
        <Container className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="grid content-start justify-items-start gap-6">
            <H1 id="contact-title" className="mk-lift text-[2.5rem] sm:text-[3.4rem] lg:text-[3.6rem]">
              Ask us <Accent className="text-brand-ink">anything.</Accent>
            </H1>
            <Lead className="mk-rise mk-rise-2">
              Pricing for your school, switching from what you use now, or how something works. We’ll reply by email.
            </Lead>
            <dl className="mk-rise mk-rise-3 grid gap-5 border-t border-hairline pt-6">
              <div>
                <dt className="text-sm text-slate-600">Email</dt>
                <dd>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-lg font-semibold text-brand-ink underline-offset-4 hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Rather talk it through?</dt>
                <dd className="mt-3">
                  <DemoLink from="contact">Book a {DEMO_MINUTES}-minute demo</DemoLink>
                </dd>
              </div>
            </dl>
          </div>
          <Tray className="mk-lift mk-rise-4">
            <div className="p-6 sm:p-8">
              <h2 className="mb-6 text-2xl font-semibold tracking-[-0.02em] text-ink">Send a message</h2>
              <ContactForm />
            </div>
          </Tray>
        </Container>
      </section>
    </>
  )
}
