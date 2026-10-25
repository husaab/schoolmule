import { Plus } from 'lucide-react'
import JsonLd from './JsonLd'
import { faqSchema } from '@/lib/marketing/seo'

export interface FaqItem {
  q: string
  a: string
}

/** Questions in the order principals ask them. Plain <details>, so it works without JavaScript. */
export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="mk-faq border-t border-hairline">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-hairline">
          <summary className="flex cursor-pointer items-start justify-between gap-6 rounded-sm py-5 text-lg font-semibold text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30">
            {item.q}
            <Plus
              aria-hidden
              strokeWidth={1.75}
              className="mt-1 size-5 shrink-0 text-slate-400 transition-transform duration-200 ease-film group-open:rotate-45"
            />
          </summary>
          <p className="max-w-3xl pb-6 leading-relaxed text-slate-600">{item.a}</p>
        </details>
      ))}
      <JsonLd data={faqSchema(items)} />
    </div>
  )
}
