import type { Metadata } from 'next'
import CtaBand from '@/components/marketing/CtaBand'
import DemoLink from '@/components/marketing/DemoLink'
import FeatureRows from '@/components/marketing/FeatureRows'
import FilmPlayer from '@/components/marketing/film/FilmPlayer'
import WatchFilmButton from '@/components/marketing/film/WatchFilmButton'
import { SampleData, Tray } from '@/components/marketing/frames'
import JsonLd from '@/components/marketing/JsonLd'
import { Accent, Container, H1, H2, Lead, Section } from '@/components/marketing/ui'
import { CLASSROOM, COMMUNICATION, OPERATIONS, REPORTING } from '@/lib/marketing/features'
import { breadcrumbSchema, filmSchema, pageMetadata, softwareSchema } from '@/lib/marketing/seo'
import { CHAPTERS, formatTime, HERO_LOOP } from '@/lib/marketing/site'

// The product overview: every feature, grouped, each opening a closer look
// in a modal. Ends with what SchoolMule doesn't do yet, said plainly.

export const metadata: Metadata = pageMetadata({
  title: 'Features: Gradebook, Report Cards, Attendance and Parent Portal',
  description:
    'Everything SchoolMule does for a small school: gradebook, attendance, report cards, JK and SK skills reports, parent and teacher messages, announcements, timetables, staff hours and more.',
  path: '/product',
})

const GROUPS = [
  { id: 'classroom', title: 'In the classroom', lead: 'Attendance, grades and classwork, ready for families the moment a teacher publishes.', features: CLASSROOM },
  { id: 'families', title: 'With families', lead: 'Private messages with context, announcements, and a short summary of each week.', features: COMMUNICATION },
  { id: 'reports', title: 'Report cards', lead: 'Comments written in the gradebook, and a whole class printed at once.', features: REPORTING },
  { id: 'office', title: 'In the office', lead: 'Timetables, staff hours, approvals and the rest of the running of the school.', features: OPERATIONS },
]

const NOT_YET = [
  ['Invoices and payments', 'Tuition is read from QuickBooks Online, and invoicing stays there.'],
  ['A French or Arabic interface', 'SchoolMule’s screens are in English. Any subject can be taught and graded.'],
  ['Montessori observation records', 'Kindergarten is reported on skills; there are no lesson-by-lesson observation records.'],
  ['A Hifz tracker', 'Quran can be a class with its own gradebook and report card line.'],
]

export default function ProductPage() {
  const chapters = CHAPTERS.filter((c) => ['teachers', 'students', 'parents', 'office'].includes(c.key))
  return (
    <>
      <JsonLd data={[softwareSchema, filmSchema('/product'), breadcrumbSchema([{ name: 'Product', path: '/product' }])]} />

      <section aria-labelledby="product-title" className="bg-gradient-to-b from-mist via-white to-white pb-16 pt-28 sm:pt-36 lg:pt-40">
        <Container>
          <div className="grid max-w-3xl justify-items-start gap-6">
            <H1 id="product-title" className="mk-lift">
              Everything a small school <Accent className="text-brand-ink">runs on.</Accent>
            </H1>
            <Lead className="mk-rise mk-rise-2">One system for the office, the classroom and home, with a view for each person in your school.</Lead>
            <div className="mk-rise mk-rise-3 flex w-full flex-wrap gap-3 max-sm:[&>*]:w-full">
              <DemoLink from="product-hero" />
            </div>
          </div>

          <div className="mk-lift mk-rise-4 mt-12 grid gap-4">
            <Tray>
              <FilmPlayer src={HERO_LOOP.src} srcSmall={HERO_LOOP.srcSmall} poster={HERO_LOOP.poster} from="product-hero" priority />
            </Tray>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-sm text-slate-600">Watch it all, or jump to a part:</span>
              {chapters.map((c) => (
                <WatchFilmButton key={c.key} from={`product-chapter-${c.key}`} start={c.start} variant="link" showLength={false}>
                  {c.label} {formatTime(c.start)}
                </WatchFilmButton>
              ))}
            </div>
            <SampleData />
          </div>
        </Container>
      </section>

      <nav aria-label="Features" className="sticky top-[5.25rem] z-30 hidden border-y border-hairline bg-white/90 backdrop-blur-md md:block">
        <Container className="flex gap-8 py-3 text-[0.95rem] font-medium">
          {GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="text-slate-600 hover:text-ink">
              {g.title}
            </a>
          ))}
          <a href="#not-yet" className="text-slate-600 hover:text-ink">
            Not built yet
          </a>
        </Container>
      </nav>

      {GROUPS.map((g, i) => (
        <Section key={g.id} id={g.id} tone={i % 2 ? 'mist' : 'white'} labelledBy={`${g.id}-title`} className="scroll-mt-32">
          <Container>
            <div className="mb-10 grid max-w-3xl gap-4">
              <H2 id={`${g.id}-title`}>{g.title}</H2>
              <Lead>{g.lead}</Lead>
            </div>
            <FeatureRows features={g.features} />
          </Container>
        </Section>
      ))}

      <Section id="not-yet" labelledBy="not-yet-title" className="scroll-mt-32">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            <H2 id="not-yet-title">What SchoolMule doesn’t do yet.</H2>
            <Lead>Better to hear it here than halfway through a demo.</Lead>
          </div>
          <dl className="grid border-t border-hairline">
            {NOT_YET.map(([t, d]) => (
              <div key={t} className="grid gap-1 border-b border-hairline py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <dt className="font-semibold text-ink">{t}</dt>
                <dd className="leading-relaxed text-slate-600">{d}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <CtaBand from="product" />
    </>
  )
}
