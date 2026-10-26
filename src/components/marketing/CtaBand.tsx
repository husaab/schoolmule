import Image from 'next/image'
import Link from 'next/link'
import { DEMO_MINUTES, FOUNDER } from '@/lib/marketing/site'
import DemoLink from './DemoLink'
import WatchFilmButton from './film/WatchFilmButton'
import { Accent, Container } from './ui'

/** The closing call to action on every page, with a quieter door for each kind of visitor. */
export default function CtaBand({ from, heading, sub }: { from: string; heading?: React.ReactNode; sub?: string }) {
  return (
    <section aria-labelledby={`${from}-cta`} className="bg-gradient-to-b from-white to-mist py-24 sm:py-32">
      <Container className="grid justify-items-center gap-7 text-center">
        <Image src="/marketing/mule-mark.png" alt="" width={74} height={56} sizes="74px" className="h-14 w-auto" />
        <h2
          id={`${from}-cta`}
          className="max-w-3xl text-balance text-[2.3rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[3.4rem]"
        >
          {heading ?? (
            <>
              See it with <Accent className="text-brand-ink">your school</Accent> in mind.
            </>
          )}
        </h2>
        <p className="max-w-xl text-lg leading-relaxed text-slate-600">
          {sub ?? `A ${DEMO_MINUTES}-minute call with ${FOUNDER.firstName}, who builds SchoolMule. Bring how your school runs today.`}
        </p>
        <DemoLink from={`${from}-closer`} />
        <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-[0.98rem]">
          <WatchFilmButton from={`${from}-closer`} variant="link" />
          <Link href="/contact" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
            Ask a question
          </Link>
          <Link href="/contact" className="font-semibold text-brand-ink underline-offset-4 hover:underline">
            Starting a new school?
          </Link>
        </div>
      </Container>
    </section>
  )
}
