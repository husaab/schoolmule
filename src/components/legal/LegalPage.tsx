import { FC, ReactNode } from 'react'

interface LegalPageProps {
  title: string
  /** Shown under the title, e.g. "Last updated 2 September 2026". */
  updated: string
  children: ReactNode
}

/**
 * Shared layout for the legal documents (privacy, terms). The website layout
 * supplies the navbar and footer.
 *
 * These are read, not browsed, so nothing animates: content that moves as you
 * scroll is hostile when someone is trying to find one clause.
 */
const LegalPage: FC<LegalPageProps> = ({ title, updated, children }) => (
  <article className="bg-white">
    <header className="border-b border-hairline bg-gradient-to-b from-mist to-white">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-32 sm:px-6 sm:pt-40 lg:px-8">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">{title}</h1>
        <p className="mt-3 text-slate-600">{updated}</p>
      </div>
    </header>

    {/* `prose`-like spacing written out, since the project has no typography plugin. */}
    <div
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16
                 [&_a]:font-medium [&_a]:text-brand-ink [&_a]:underline [&_a]:underline-offset-2
                 [&_code]:rounded [&_code]:bg-mist [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]
                 [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink
                 [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink
                 [&_li]:leading-relaxed [&_li]:text-slate-600
                 [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-slate-600
                 [&_strong]:font-semibold [&_strong]:text-ink
                 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6"
    >
      {children}
    </div>
  </article>
)

export default LegalPage
