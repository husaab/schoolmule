import type { PatchNoteCategory } from '@/services/types/patchNote'

const CATEGORY_CONFIG: Record<PatchNoteCategory, { label: string; gradient: string }> = {
  new_feature: { label: 'NEW FEATURE', gradient: 'from-cyan-600 to-teal-600' },
  improvement: { label: 'IMPROVEMENT', gradient: 'from-purple-500 to-violet-600' },
  bug_fix: { label: 'BUG FIX', gradient: 'from-orange-500 to-orange-600' },
  announcement: { label: 'ANNOUNCEMENT', gradient: 'from-blue-500 to-blue-600' },
  coming_soon: { label: 'COMING SOON', gradient: 'from-emerald-500 to-green-600' },
  heads_up: { label: 'HEADS UP', gradient: 'from-rose-500 to-red-600' },
}

export default function CategoryTag({ category }: { category: PatchNoteCategory }) {
  const config = CATEGORY_CONFIG[category]
  return (
    <span
      className={`bg-gradient-to-r ${config.gradient} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}
    >
      {config.label}
    </span>
  )
}
