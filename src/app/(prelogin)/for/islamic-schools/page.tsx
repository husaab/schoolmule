import type { Metadata } from 'next'
import CtaBand from '@/components/marketing/CtaBand'
import DemoLink from '@/components/marketing/DemoLink'
import Faq, { type FaqItem } from '@/components/marketing/Faq'
import JsonLd from '@/components/marketing/JsonLd'
import ReportSamples from '@/components/marketing/ReportSamples'
import WatchFilmButton from '@/components/marketing/film/WatchFilmButton'
import { SampleData, ScreenFrame } from '@/components/marketing/frames'
import { Accent, Container, H1, H2, Lead, Pill, Section, TextLink } from '@/components/marketing/ui'
import { breadcrumbSchema, pageMetadata } from '@/lib/marketing/seo'

// The first segment page. Specific to how Ontario Islamic schools run (see
// docs/research/landing-revamp/notes/dossier-synthesis.md), and claiming only
// what the product does: no Hifz tracker, no Arabic interface.

export const metadata: Metadata = pageMetadata({
  title: 'School management software for Islamic schools in Ontario',
  description:
    'Quran, Arabic and Islamic Studies graded beside Ontario subjects on one report card, JK and SK reported on skills, registration forms, and families kept informed in one place.',
  path: '/for/islamic-schools',
})

const FAQ: FaqItem[] = [
  {
    q: 'Can we grade Quran and Islamic Studies?',
    a: 'Yes. Quran, Arabic and Islamic Studies can be classes like any other, with their own gradebooks, teacher comments and a line on the report card. SchoolMule does not have a separate Hifz tracker.',
  },
  {
    q: 'Is SchoolMule available in Arabic?',
    a: 'Arabic can be taught and graded like any subject. SchoolMule’s own screens are in English.',
  },
  {
    q: 'Our school is run by a board. Can board members have access?',
    a: 'Yes. Give each person a role with only what they need to see, and open SchoolMule as any teacher or parent sees it, read-only, when you need to check something.',
  },
  {
    q: 'Can we keep student photos private?',
    a: 'Student photos stay hidden everywhere until your school turns them on.',
  },
  {
    q: 'What does SchoolMule cost?',
    a: 'Pricing depends on the size of your school. You’ll get an exact number on your demo call.',
  },
]

const POINTS = [
  {
    title: 'Registration without the pile of forms',
    text: 'Put your registration form online with a public link, track each submission, and turn an accepted family into student records in one step.',
  },
  {
    title: 'Families in one place, not a group chat',
    text: 'Announce to a class, a grade or the whole school, see who has read it, and ask families to confirm with “Got it”. Private questions go to the teacher, not the group.',
  },
  {
    title: 'Photos only when you say so',
    text: 'Student photos stay hidden until your school turns them on.',
  },
  {
    title: 'JK and SK on skills',
    text: 'Kindergarten report cards rate skills, not percentages, with a comment for each area.',
  },
]

export default function IslamicSchoolsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Islamic schools', path: '/for/islamic-schools' }])} />

      <section aria-labelledby="isl-title" className="bg-gradient-to-b from-mist via-white to-white pb-16 pt-28 sm:pb-24 sm:pt-36 lg:pt-40">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
          <div className="grid justify-items-start gap-6">
            <div className="mk-rise mk-rise-1">
              <Pill>For Islamic schools in Ontario</Pill>
            </div>
            <H1 id="isl-title" className="mk-lift text-[2.3rem] sm:text-[3rem] lg:text-[3.1rem]">
              Ontario subjects and Islamic studies, <Accent className="text-brand-ink">in one system.</Accent>
            </H1>
            <Lead className="mk-rise mk-rise-2">
              Quran, Arabic and Islamic Studies graded beside Math and Science, kindergarten reported on skills, and families kept informed in one place.
            </Lead>
            <div className="mk-rise mk-rise-3 flex w-full flex-wrap gap-3 max-sm:[&>*]:w-full">
              <DemoLink from="islamic-hero" />
              <WatchFilmButton from="islamic-hero" />
            </div>
          </div>
          <div className="mk-lift mk-rise-4">
            <ScreenFrame
              src="/marketing/screens/student-home.jpg"
              alt="A Grade 5 student's home page listing Arabic, Islamic Studies, French and Ontario subjects"
              url="schoolmule.ca/student"
              priority
              sizes="(min-width: 1024px) 640px, 100vw"
            />
            <SampleData className="mt-3" />
          </div>
        </Container>
      </section>

      <Section labelledBy="isl-reports-title">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div className="grid gap-6">
            <H2 id="isl-reports-title">Every subject on one report card.</H2>
            <Lead>
              Quran, Arabic and Islamic Studies are classes like any other: a weighted gradebook, teacher comments, and a line on the same report card as Language Arts and Math.
            </Lead>
            <p className="max-w-xl leading-relaxed text-slate-600">
              Report cards print as PDFs with your school’s logo, for a whole class at once. If your school uses its own format, bring it to the demo call.
            </p>
          </div>
          <ReportSamples from="islamic" />
        </Container>
      </Section>

      <Section tone="mist" labelledBy="isl-points-title">
        <Container>
          <H2 id="isl-points-title" className="mb-12 max-w-3xl">
            Built around how your school runs.
          </H2>
          <dl className="grid gap-x-10 gap-y-12 md:grid-cols-2">
            {POINTS.map((p) => (
              <div key={p.title} className="grid content-start gap-2 border-t-2 border-brand pt-5">
                <dt className="text-xl font-semibold text-ink">{p.title}</dt>
                <dd className="max-w-lg text-lg leading-relaxed text-slate-600">{p.text}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section labelledBy="isl-parents-title">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="grid gap-6">
            <H2 id="isl-parents-title">Parents see their own child, and nothing else.</H2>
            <Lead>
              Grades once you publish them, attendance, announcements and the school calendar, on any phone, with no app to install.
            </Lead>
            <TextLink href="/for/parents">How it works for parents</TextLink>
          </div>
          <ScreenFrame
            src="/marketing/screens/parent-dashboard.jpg"
            alt="The parent overview with announcements and recently published grades"
            url="schoolmule.ca/parent/dashboard"
            sizes="(min-width: 1024px) 700px, 100vw"
          />
        </Container>
      </Section>

      <Section tone="mist" labelledBy="isl-faq-title">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <H2 id="isl-faq-title">Questions Islamic schools ask.</H2>
          <Faq items={FAQ} />
        </Container>
      </Section>

      <CtaBand from="islamic" />
    </>
  )
}
