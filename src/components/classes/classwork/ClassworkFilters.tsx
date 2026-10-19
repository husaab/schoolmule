// src/components/classes/classwork/ClassworkFilters.tsx
// Classwork's "All topics" and "All types" filters (?topic=, ?kind= in the
// URL): a topic (or "No topic"), and a kind of work.
'use client'

import SearchableSelect from '@/components/ui/SearchableSelect'
import { ITEM_KINDS, KIND_PLURALS, type TopicFilter } from '@/lib/classworkRows'
import type { ItemKind, Topic } from '@/services/types/classwork'

interface ClassworkFiltersProps {
  topics: Topic[]
  topic: TopicFilter
  kind: ItemKind | null
  onChange: (patch: { topic?: string | null; kind?: string | null }) => void
}

export default function ClassworkFilters({ topics, topic, kind, onChange }: ClassworkFiltersProps) {
  const topicOptions = [
    ...[...topics].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => ({ value: t.topicId, label: t.name })),
    { value: 'none', label: 'No topic' },
  ]
  const kindOptions = ITEM_KINDS.map((k) => ({
    value: k,
    label: KIND_PLURALS[k],
  }))

  return (
    <div className="flex flex-wrap gap-2">
      <SearchableSelect
        options={topicOptions}
        value={topic ?? ''}
        onChange={(value) => onChange({ topic: value || null })}
        allLabel="All topics"
        ariaLabel="Topic"
        searchPlaceholder="Find a topic"
        className="min-w-[150px]"
        triggerClassName="h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-cyan-200"
      />
      <SearchableSelect
        options={kindOptions}
        value={kind ?? ''}
        onChange={(value) => onChange({ kind: value || null })}
        allLabel="All types"
        ariaLabel="Type"
        className="min-w-[140px]"
        triggerClassName="h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-cyan-200"
      />
    </div>
  )
}
