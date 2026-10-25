import Image from 'next/image'
import Link from 'next/link'
import CtaBand from './CtaBand'
import DemoLink from './DemoLink'
import Faq from './Faq'
import FilmPlayer from './film/FilmPlayer'
import WatchFilmButton from './film/WatchFilmButton'
import { PhoneFrame, SampleData, ScreenFrame, Tray } from './frames'
import JsonLd from './JsonLd'
import { Accent, Container, cx, H1, H2, Lead, Pill, Section } from './ui'
import { SAME_MOMENT, type RolePageData } from '@/lib/marketing/roles'
import { chapter, VIEW_COLOURS, type ViewKey } from '@/lib/marketing/site'
import { breadcrumbSchema, filmSchema } from '@/lib/marketing/seo'

// One template for the four views (/for/<slug>): the role's own chapter of
// the film, the jobs it does, the same moment from the other three views,
// and the questions that role asks.

function ExistingUsers({ view }: { view: ViewKey }) {
  return (
    <div className={cx('rounded-2xl px-5 py-4 ring-1 ring-ink/[0.06] sm:flex sm:items-center sm:justify-between sm:gap-6', VIEW_COLOURS[view].wash)}>
      <p className="font-medium text-ink">Your school already uses SchoolMule?</p>
      <p className="mt-1 flex gap-5 sm:mt-0">
        <Link href="/login" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
          Log in
        </Link>
        <Link href="/signup" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function RolePage({ data }: { data: RolePageData }) {
  const clip = chapter(data.chapter)
  const colours = VIEW_COLOURS[data.view]
  const others = (Object.keys(SAME_MOMENT) as ViewKey[]).filter((k) => k !== data.view)
  const path = `/for/${data.slug}`

  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: data.name, path }]), filmSchema(path)]} />

      <section aria-labelledby="role-title" className="bg-gradient-to-b from-mist via-white to-white pb-16 pt-28 sm:pb-24 sm:pt-36 lg:pt-40">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
          <div className="grid justify-items-start gap-6">
            <div className="mk-rise mk-rise-1">
              <Pill dot={colours.dot}>{data.pill}</Pill>
            </div>
            <H1 id="role-title" className="mk-lift text-[2.3rem] sm:text-[3rem] lg:text-[3.1rem]">
              {data.title.plain}
              <Accent className={colours.text}>{data.title.accent}</Accent>
            </H1>
            <Lead className="mk-rise mk-rise-2">{data.lead}</Lead>
            <div className="mk-rise mk-rise-3 flex w-full flex-wrap gap-3 max-sm:[&>*]:w-full">
              <DemoLink from={`${data.slug}-hero`} />
              <WatchFilmButton from={`${data.slug}-hero`} start={clip.start} showLength={false}>
                Watch this part
              </WatchFilmButton>
            </div>
          </div>
          <div className="mk-lift mk-rise-4">
            <Tray>
              <FilmPlayer
                src={clip.loop}
                poster={clip.poster}
                startAt={clip.start}
                from={`${data.slug}-hero`}
                length={null}
                pillPosition="bottom"
                priority
                sizes="(min-width: 1024px) 640px, 100vw"
                className="rounded-none"
              />
            </Tray>
            <SampleData className="mt-3" />
          </div>
        </Container>
      </section>

      {data.existingUsers && (
        <Container className="pb-4">
          <ExistingUsers view={data.view} />
        </Container>
      )}

      <Section labelledBy="jobs-title" className="pt-12 sm:pt-16 lg:pt-20">
        <Container>
          <H2 id="jobs-title" className="sr-only">
            What SchoolMule does for {data.name.toLowerCase()}
          </H2>
          <div className="grid gap-20 sm:gap-28">
            {data.jobs.map((job, i) => (
              <article
                key={job.title}
                className={cx(
                  'grid items-center gap-8 lg:gap-14',
                  i % 2 === 1 ? 'lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]' : 'lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]',
                )}
              >
                <div className={cx('grid content-start gap-4', i % 2 === 1 && 'lg:order-2')}>
                  <span aria-hidden className={cx('h-1 w-10 rounded-full', colours.dot)} />
                  <h3 className="text-balance text-[1.7rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[2rem]">
                    {job.title}
                  </h3>
                  <p className="max-w-md text-lg leading-relaxed text-slate-600">{job.text}</p>
                </div>
                <div className={cx(i % 2 === 1 && 'lg:order-1', job.phone && 'justify-self-center')}>
                  {job.phone ? (
                    <PhoneFrame src={job.src} alt={job.alt} />
                  ) : (
                    <ScreenFrame src={job.src} alt={job.alt} url={job.url} sizes="(min-width: 1024px) 700px, 100vw" />
                  )}
                </div>
              </article>
            ))}
          </div>
          {data.also && <p className="mt-20 max-w-3xl text-lg leading-relaxed text-slate-600">{data.also}</p>}
        </Container>
      </Section>

      <Section tone="mist" labelledBy="others-title">
        <Container>
          <div className="mb-10 grid max-w-3xl gap-4">
            <H2 id="others-title">The same records, from every other view.</H2>
            <Lead>One quiz, seen by the rest of the school.</Lead>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {others.map((k) => {
              const o = SAME_MOMENT[k]
              return (
                <li key={k}>
                  <Link
                    href={o.href}
                    className="group grid h-full content-start gap-4 rounded-[1.375rem] bg-white p-1.5 ring-1 ring-ink/[0.06] transition-shadow duration-200 hover:shadow-[0_20px_40px_-26px_rgba(11,19,36,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
                  >
                    <span className="relative block aspect-[8/5] overflow-hidden rounded-[1rem] bg-mist">
                      <Image src={o.src} alt="" fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover object-left-top" />
                    </span>
                    <span className="grid gap-1 px-3.5 pb-4">
                      <span className={cx('flex items-center gap-2 text-sm font-semibold', VIEW_COLOURS[k].text)}>
                        <span aria-hidden className={cx('size-2 rounded-full', VIEW_COLOURS[k].dot)} />
                        {o.label}
                      </span>
                      <span className="leading-snug text-slate-700">{o.text}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      <Section labelledBy="role-faq-title">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <H2 id="role-faq-title">Questions {data.name.toLowerCase()} ask.</H2>
          <Faq items={data.faq} />
        </Container>
      </Section>

      <CtaBand from={data.slug} heading={data.closer?.heading} sub={data.closer?.sub} />
    </>
  )
}
