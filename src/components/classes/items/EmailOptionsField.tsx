// src/components/classes/items/EmailOptionsField.tsx
// Who is emailed about an item. An assessment: "Email students and parents
// now" (a line in its side card). An assignment or quiz: the Emails card with
// the post email and the evening-before reminder. A material: the post email.
'use client'

import type { ItemFormValues } from '@/lib/itemForm'
import { CardTitle, CheckboxRow, FormCard } from './formParts'

interface EmailOptionsFieldProps {
  variant: 'assessment' | 'turnin' | 'material'
  values: Pick<ItemFormValues, 'emailStudents' | 'remindStudents' | 'audience' | 'studentIds'>
  set: (patch: Partial<ItemFormValues>) => void
  studentCount: number
  disabled?: boolean
}

export default function EmailOptionsField({ variant, values, set, studentCount, disabled }: EmailOptionsFieldProps) {
  if (variant === 'assessment') {
    return (
      <CheckboxRow checked={values.emailStudents} onChange={(emailStudents) => set({ emailStudents })} disabled={disabled}>
        Email students and parents now
      </CheckboxRow>
    )
  }

  const reach = values.audience === 'some' ? `${values.studentIds.length} chosen` : `all ${studentCount}`
  return (
    <FormCard className="!gap-3">
      <CardTitle>Emails</CardTitle>
      <CheckboxRow checked={values.emailStudents} onChange={(emailStudents) => set({ emailStudents })} disabled={disabled}>
        Email students when it&apos;s posted <span className="text-slate-500">· {reach}</span>
      </CheckboxRow>
      {variant === 'turnin' && (
        <>
          <CheckboxRow checked={values.remindStudents} onChange={(remindStudents) => set({ remindStudents })} disabled={disabled}>
            Remind students the evening before if it isn&apos;t turned in
          </CheckboxRow>
          <p className="text-[13px] leading-relaxed text-slate-600">
            Parents see it in the weekly summary, and get a missing-work alert if it&apos;s late.
          </p>
        </>
      )}
    </FormCard>
  )
}
