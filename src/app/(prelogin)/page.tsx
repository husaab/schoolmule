import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import HeroDemoVideo from '@/components/landing/HeroDemoVideo'
import CtaBand from '@/components/marketing/CtaBand'
import DemoLink from '@/components/marketing/DemoLink'
import Faq, { type FaqItem } from '@/components/marketing/Faq'
import FeatureRows from '@/components/marketing/FeatureRows'
import { OPERATIONS } from '@/lib/marketing/features'
import FounderNote from '@/components/marketing/FounderNote'
import JsonLd from '@/components/marketing/JsonLd'
import QuizStory from '@/components/marketing/QuizStory'
import ReportSamples from '@/components/marketing/ReportSamples'
import ViewTabs from '@/components/marketing/ViewTabs'
import WatchFilmButton from '@/components/marketing/film/WatchFilmButton'
import { PhoneFrame, SampleData, Tray } from '@/components/marketing/frames'
import { Accent, Container, H1, H2, Lead, Pill, Section, TextLink } from '@/components/marketing/ui'
import { filmSchema, pageMetadata, softwareSchema } from '@/lib/marketing/seo'
import { DEMO_MINUTES, PRODUCT_LINKS, USAGE_CLAIM, VIEW_COLOURS } from '@/lib/marketing/site'

// The homepage. Every section, and why it's here, is in
// docs/research/landing-revamp/plan.md §3.1.

export const metadata: Metadata = pageMetadata({
  title: 'SchoolMule: School Management for Ontario Independent Schools',
  description:
    'Attendance, grades, report cards and parent messages in one system, with a view for your office, teachers, parents and students. Built for independent schools in Ontario, JK to Grade 8.',
  path: '/',
})

const FAQ: FaqItem[] = [
  {
    q: 'What does SchoolMule cost?',
    a: 'Pricing depends on the size of your school. You’ll get an exact number on your demo call.',
  },
  {
    q: 'Do parents need to download an app?',
    a: 'No. Families get an email when something new is published, and the link in it signs them in with one tap. SchoolMule works in any browser, on a phone or a computer.',
  },
  {
    q: 'Can it make our report card?',
    a: 'SchoolMule makes report cards for Grades 1 to 8 and skill-based report cards for JK and SK, as PDFs with your school’s logo. If your school uses its own format, bring it to the demo call.',
  },
  {
    q: 'Can you bring in our current records?',
    a: 'Yes. Send us your student, family and class lists in whatever form you keep them, and we’ll bring them in.',
  },
  {
    q: 'Will our teachers manage it?',
    a: 'Teachers start with two things: attendance, and a gradebook that works like a simple spreadsheet and saves as they type. Admins can open any teacher’s view, read-only, to help.',
  },
  {
    q: 'Does it work with Google Classroom?',
    a: 'Schools that use Google Classroom can keep it for classwork and use SchoolMule for attendance, grades, report cards and families. SchoolMule also has its own classwork and quizzes when you want them, and staff and students can sign in with Google.',
  },
  {
    q: 'Who can see our school’s information?',
    a: 'Only people at your school, and only what their role allows. Parents see only their own children, and only grades you have published. Every request is checked on our server.',
  },
  {
    q: 'Where is our data stored?',
    a: 'Securely, on Amazon Web Services (AWS) cloud servers. Your school’s information is encrypted on the way to SchoolMule and where it is stored.',
  },
]

const STACK = [
  { name: 'Registration form', kind: 'Forms', tint: 'bg-violet-700' },
  { name: 'Grades_FINAL_v3.xlsx', kind: 'XLS', tint: 'bg-emerald-700' },
  { name: 'Report card template.docx', kind: 'DOC', tint: 'bg-blue-700' },
  { name: 'Grade 5 parents', kind: 'Chat', tint: 'bg-green-700' },
  { name: 'Attendance binder', kind: 'Paper', tint: 'bg-amber-700' },
  { name: 'Inbox, 214 unread', kind: 'Mail', tint: 'bg-rose-700' },
]

const RECORD = [
  ['Math, Quiz 3', '19 / 20'],
  ['Attendance this term', '34 of 35 days'],
  ['Messages with family', '1 open, about Quiz 3'],
  ['Report cards', 'Term 1 PDF'],
  ['Guardians', 'Amal and Karim Haddad'],
]

const FIT = [
  { title: 'Faith studies on the report card', text: 'Quran, Arabic and Islamic Studies sit beside Math and Science, graded the same way.' },
  { title: 'JK and SK on skills', text: 'Kindergarten report cards rate skills, not percentages, with a comment for each area.' },
  { title: 'Ontario holidays in staff pay', text: 'Statutory holidays are counted in staff hours automatically.' },
  { title: 'Photos off until you say so', text: 'Student photos stay hidden until your school turns them on.' },
]

export default function HomePage() {
  return (
    <>
      <JsonLd data={[softwareSchema, filmSchema('/')]} />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-gradient-to-b from-mist via-white to-white pt-28 sm:pt-36 lg:pt-40">
        <Container>
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-16">
          <div className="grid max-w-[46rem] justify-items-start gap-6">
            <div className="mk-rise mk-rise-1">
              <Pill>For Ontario independent schools, JK to Grade 8</Pill>
            </div>
            <H1 id="hero-title" className="mk-lift">
              Your whole school, <Accent className="text-brand-ink sm:block">in one place.</Accent>
            </H1>
            <Lead className="mk-rise mk-rise-2">
              Attendance, grades, report cards and parent messages in one simple system, with a view for your office, teachers, parents and students.
            </Lead>
            <div className="mk-rise mk-rise-3 flex w-full flex-wrap gap-3 max-sm:[&>*]:w-full">
              <DemoLink from="hero" />
              <WatchFilmButton from="hero-button" />
            </div>
            <p className="mk-rise mk-rise-3 text-[0.95rem] text-slate-600">
              {USAGE_CLAIM}. Book {DEMO_MINUTES} minutes with the founder.
            </p>
          </div>
          <nav aria-label="SchoolMule for each view" className="mk-rise mk-rise-3 hidden border-t border-hairline lg:block">
            {PRODUCT_LINKS.filter((l) => l.view).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-hairline py-3.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
              >
                <span aria-hidden className={`size-2.5 rounded-full ${VIEW_COLOURS[l.view!].dot}`} />
                <span>
                  <span className="block font-semibold text-ink">{l.label}</span>
                  <span className="block text-sm text-slate-600">{l.blurb}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-4 text-slate-400 transition-transform duration-200 ease-film group-hover:translate-x-0.5 group-hover:text-ink"
                />
              </Link>
            ))}
          </nav>
          </div>
          <div className="mt-12 sm:mt-16">
            <Tray>
              <HeroDemoVideo />
            </Tray>
            <SampleData className="mt-3" />
          </div>
        </Container>
      </section>

      {/* Four views */}
      <Section labelledBy="views-title">
        <Container>
          <div className="mb-10 grid max-w-3xl gap-4">
            <H2 id="views-title">Four views. One set of records.</H2>
            <Lead>Everyone works from the same records, so the grade a teacher enters is the grade a parent sees at home.</Lead>
          </div>
          <ViewTabs />
          <p className="mt-10 text-slate-600">
            Your school already uses SchoolMule?{' '}
            <Link href="/login" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
              Log in
            </Link>{' '}
            or{' '}
            <Link href="/signup" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
              sign up
            </Link>
            .
          </p>
        </Container>
      </Section>

      {/* Scattered to settled */}
      <Section tone="mist" labelledBy="settled-title">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="grid gap-6">
            <H2 id="settled-title">From scattered to settled.</H2>
            <Lead>
              Most small schools run on forms, spreadsheets, email and group chats. SchoolMule puts it all on one record for each student.
            </Lead>
            <ul className="flex flex-wrap gap-2.5" aria-label="What many schools use today">
              {STACK.map((s, i) => (
                <li
                  key={s.name}
                  className={`inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[0.92rem] text-slate-700 shadow-[0_8px_20px_-14px_rgba(11,19,36,0.35)] ring-1 ring-ink/[0.06] ${
                    i % 2 ? 'sm:rotate-[1.2deg]' : 'sm:-rotate-[1.4deg]'
                  }`}
                >
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white ${s.tint}`}>{s.kind}</span>
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
          <figure className="rounded-[1.375rem] bg-ink/[0.035] p-1.5 ring-1 ring-ink/[0.06]">
            <div className="grid gap-5 rounded-[1rem] bg-white p-6 shadow-[0_28px_56px_-28px_rgba(11,59,82,0.38)] sm:p-7">
              <div className="flex items-center gap-4">
                <span aria-hidden className="grid size-12 place-items-center rounded-full bg-amber-100 font-semibold text-parents-ink">
                  AH
                </span>
                <div>
                  <p className="text-lg font-semibold text-ink">Adam Haddad</p>
                  <p className="text-sm text-slate-600">Grade 5, homeroom Ms. Saleh</p>
                </div>
              </div>
              <dl className="grid gap-2">
                {RECORD.map(([k, v]) => (
                  <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-xl bg-mist px-4 py-3">
                    <dt className="text-slate-600">{k}</dt>
                    <dd className="font-semibold tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figcaption className="px-2 pb-1 pt-3 text-xs text-slate-600">One student’s record, from the demo school</figcaption>
          </figure>
        </Container>
      </Section>

      {/* Follow one quiz */}
      <Section labelledBy="story-title">
        <Container>
          <div className="mb-12 grid max-w-3xl gap-4">
            <H2 id="story-title">Follow one quiz through the school.</H2>
            <Lead>One grade, from the teacher’s gradebook to a student, a parent, and back as a question.</Lead>
          </div>
          <QuizStory />
        </Container>
      </Section>

      {/* Parents */}
      <Section labelledBy="parents-title" className="bg-gradient-to-b from-white to-[#fff6ea]">
        <Container className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-7">
            <div className="grid gap-4">
              <p className="font-semibold text-parents-ink">For families</p>
              <H2 id="parents-title">Parents actually use it.</H2>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2">
              {[
                ['No app to install', 'Families get an email when something is new, and sign in from it with one tap.'],
                ['Only their own child', 'And only the grades you’ve chosen to publish.'],
                ['The week, in a few lines', 'A short summary of how their child is doing, written by AI and labelled that way.'],
                ['Questions don’t get lost', 'If a parent’s message goes unanswered, SchoolMule can remind the teacher.'],
              ].map(([t, d]) => (
                <div key={t} className="grid gap-1.5 border-t border-parents/30 pt-4">
                  <dt className="font-semibold text-ink">{t}</dt>
                  <dd className="leading-relaxed text-slate-600">{d}</dd>
                </div>
              ))}
            </dl>
            <TextLink href="/for/parents">How it works for parents</TextLink>
          </div>
          <div className="justify-self-center">
            <PhoneFrame
              src="/marketing/screens/parent-phone.jpg"
              alt="The parent overview on a phone: Amal Haddad’s children, the weekly summary and recent grades"
            />
          </div>
        </Container>
      </Section>

      {/* Report cards */}
      <Section labelledBy="reports-title">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div className="grid gap-6 lg:order-2">
            <H2 id="reports-title">Report cards without the late nights.</H2>
            <Lead>
              Teachers write comments in the gradebook, with a first draft from AI if they want one. Then you make a whole class’s report cards at once, as PDFs with your logo.
            </Lead>
            <p className="max-w-xl leading-relaxed text-slate-600">
              Report cards for Grades 1 to 8, skill-based report cards for JK and SK, and progress reports in the middle of the term.
            </p>
          </div>
          <div className="lg:order-1">
            <ReportSamples from="home" />
          </div>
        </Container>
      </Section>

      {/* Office */}
      <Section tone="mist" labelledBy="office-title">
        <Container>
          <div className="mb-10 grid max-w-3xl gap-4">
            <H2 id="office-title">Everything else your office runs on.</H2>
            <Lead>Open any of them for a closer look.</Lead>
          </div>
          <FeatureRows features={OPERATIONS} />
          <p className="mt-8 max-w-3xl leading-relaxed text-slate-600">
            Also: online forms and registration, tuition read from QuickBooks Online, analytics with a list of students to check in on, and a guided start to each new school year.
          </p>
          <TextLink href="/for/school-leaders" className="mt-5">
            How it works for school leaders
          </TextLink>
        </Container>
      </Section>

      {/* Fit */}
      <Section labelledBy="fit-title">
        <Container>
          <H2 id="fit-title" className="mb-12 max-w-3xl">
            Built for schools like yours.
          </H2>
          <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FIT.map((f) => (
              <div key={f.title} className="grid content-start gap-2 border-t-2 border-brand pt-5">
                <dt className="text-lg font-semibold leading-snug text-ink">{f.title}</dt>
                <dd className="leading-relaxed text-slate-600">{f.text}</dd>
              </div>
            ))}
          </dl>
          <TextLink href="/for/islamic-schools" className="mt-10">
            SchoolMule for Islamic schools
          </TextLink>
        </Container>
      </Section>

      {/* Founder */}
      <Section tone="mist" labelledBy="founder-title">
        <Container className="grid max-w-4xl gap-10">
          <h2 id="founder-title" className="sr-only">
            Who builds SchoolMule
          </h2>
          <FounderNote quote="I build SchoolMule, and I work with every school directly: setting up your classes, your report card and your staff. When something isn’t right, you email me." />
          <p className="text-slate-600">{USAGE_CLAIM}.</p>
        </Container>
      </Section>

      {/* Switching */}
      <Section labelledBy="switch-title">
        <Container>
          <div className="mb-12 grid max-w-3xl gap-4">
            <H2 id="switch-title">How switching works.</H2>
            <Lead>No big migration project. Most of it is on us.</Lead>
          </div>
          <ol className="grid gap-10 md:grid-cols-3">
            {[
              ['Send us what you have', 'Student, family and class lists, in whatever form you keep them. We bring them in.'],
              ['We set up your year', 'Your terms, subjects, classes and report card, ready before your teachers sign in.'],
              ['Your school starts', 'Teachers begin with attendance and grades. Families get an email invitation.'],
            ].map(([t, d], i) => (
              <li key={t} className="grid content-start gap-3">
                <span aria-hidden className="grid size-10 place-items-center rounded-full bg-ink text-sm font-semibold text-white tabular-nums">
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold text-ink">{t}</h3>
                <p className="leading-relaxed text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="mist" labelledBy="faq-title">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            <H2 id="faq-title">Questions principals ask.</H2>
            <p className="text-slate-600">
              Something else? <Link href="/contact" className="font-semibold text-brand-ink underline-offset-4 hover:underline">Ask us</Link>.
            </p>
          </div>
          <Faq items={FAQ} />
        </Container>
      </Section>

      <CtaBand from="home" />
    </>
  )
}
