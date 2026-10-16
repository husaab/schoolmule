// src/components/classes/items/MaterialFields.tsx
// The material form: something to read or watch, with no grade and nothing
// to turn in. Title, instructions and attachments; then topic, who it is for
// and the email. Post, Schedule and Save draft are in the header.
'use client'

import { TITLE_MAX } from '@/lib/itemForm'
import AttachmentsEditor from './AttachmentsEditor'
import AudienceField from './AudienceField'
import EmailOptionsField from './EmailOptionsField'
import { FIELD_INPUT, FormCard, LabeledField, TopicField, fieldId, type ItemFieldsProps } from './formParts'

export default function MaterialFields(props: ItemFieldsProps) {
  const { classId, studentCount, values, set, errors, topics } = props

  return (
    <>
      <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <FormCard className="!gap-[18px]">
          <LabeledField label="Title" name="title" error={errors.title}>
            <input
              id={fieldId('title')}
              value={values.title}
              maxLength={TITLE_MAX}
              aria-invalid={errors.title ? true : undefined}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Cells reading, pages 42–47"
              className={`${FIELD_INPUT} !py-3 !text-[17px]`}
            />
          </LabeledField>
          <LabeledField label="Instructions" name="instructions" optional error={errors.instructions}>
            <textarea
              id={fieldId('instructions')}
              rows={5}
              value={values.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
              className={`${FIELD_INPUT} resize-y leading-relaxed`}
            />
          </LabeledField>
          <AttachmentsEditor state={props.attachments} />
        </FormCard>
      </section>

      <aside className="flex flex-[1_1_340px] flex-col gap-4">
        <FormCard className="sm:!p-5">
          <TopicField
            topics={topics}
            value={values.topicId}
            onChange={(topicId) => set({ topicId })}
            onNewTopic={props.onNewTopic}
            error={errors.topicId}
          />
          <AudienceField
            classId={classId}
            studentCount={studentCount}
            audience={values.audience}
            studentIds={values.studentIds}
            onChange={(patch) => set(patch)}
            error={errors.studentIds}
          />
        </FormCard>
        <EmailOptionsField variant="material" values={values} set={set} studentCount={studentCount} />
      </aside>
    </>
  )
}
