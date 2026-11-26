import React from 'react'
import {
  Bars2Icon,
  Bars3BottomLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronUpDownIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline'
import { customFieldTypeLabel } from '@/lib/studentCustomFields'
import type { CustomFieldType } from '@/services/types/studentCustomField'

export const FIELD_TYPE_ICONS: Record<CustomFieldType, React.ComponentType<{ className?: string }>> = {
  text: Bars2Icon,
  textarea: Bars3BottomLeftIcon,
  number: HashtagIcon,
  date: CalendarDaysIcon,
  select: ChevronUpDownIcon,
  boolean: CheckCircleIcon,
}

/** A custom field's kind as a small quiet tag: icon and name. */
export const FieldTypeTag = ({ type }: { type: CustomFieldType }) => {
  const Icon = FIELD_TYPE_ICONS[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <Icon className="h-3.5 w-3.5" />
      {customFieldTypeLabel(type)}
    </span>
  )
}
