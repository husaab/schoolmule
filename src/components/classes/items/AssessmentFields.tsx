// src/components/classes/items/AssessmentFields.tsx
// The assessment form (the Teacher-NewAssessment board, D11): a plain
// gradebook column (name, category, out of, date) with an optional note and
// attachments, then topic, audience, "show it early" and the email, and what
// students will see. Scores are entered in Grades; nothing is turned in.
'use client'

import AttachmentsEditor from './AttachmentsEditor'
import AudienceField from './AudienceField'
import EmailOptionsField from './EmailOptionsField'
import { CategoriesLink, CategorySelect, OutOfInput } from './GradebookLinkField'
import StudentsSeePreview from './StudentsSeePreview'
import { CheckboxRow, FIELD_INPUT, FormCard, LabeledField, TopicField, fieldId, type ItemFieldsProps } from './formParts'
import { TITLE_MAX, isCalendarDate } from '@/lib/itemForm'

const points = (n: number) => String(Math.round(n * 100) / 100)

export default function AssessmentFields(props: ItemFieldsProps) {
  const { classId, subject, studentCount, values, set, errors, topics, categories, standalone, standaloneMax, kindergarten } = props
  const category = categories.find((c) => c.assessmentId === values.categoryId)
  const max = Number(values.maxScore)
  const maxOk = values.maxScore.trim() !== '' && Number.isFinite(max) && max > 0

  let info: string
  if (standalone) {
    info = `This is the same assessment the gradebook has today: a column that counts on its own${standaloneMax != null ? `, out of ${points(standaloneMax)}` : ''}. Enter scores in Grades (they save as you type), then Publish. Nothing changes about how it counts.`
  } else if (category && maxOk) {
    info = `This is the same assessment the gradebook has today: a column under ${category.name}, out of ${points(max)}. Enter scores in Grades (they save as you type), then Publish. Nothing changes about how it counts.`
  } else {
    info =
      'This is the same assessment the gradebook has today: a column in Grades. Enter scores in Grades (they save as you type), then Publish. Nothing changes about how it counts.'
  }

  let countsToward
  if (standalone) {
    countsToward = (
      <LabeledField label="Counts toward" name="categoryId" hint="Move it in Grades → Assessments & categories.">
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-700">Counts on its own</p>
      </LabeledField>
    )
  } else if (kindergarten || categories.length === 0) {
    countsToward = (
      // The note is the explanation: a save stops here and focuses it.
      <LabeledField label="Counts toward" name="categoryId">
        <p id={fieldId('categoryId')} tabIndex={-1} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-snug text-amber-900 outline-none">
          {kindergarten ? (
            "JK and SK are graded on skills, so there's no gradebook column to add here."
          ) : (
            <>
              No categories yet. A category is a multiple assessment that holds several. Add one in{' '}
              <CategoriesLink classId={classId} />, or edit an assessment there and tick &ldquo;Make this a multiple
              assessment&rdquo;.
            </>
          )}
        </p>
      </LabeledField>
    )
  } else {
    countsToward = (
      <LabeledField label="Counts toward" name="categoryId" error={errors.categoryId}>
        <CategorySelect categories={categories} value={values.categoryId} onChange={(categoryId) => set({ categoryId })} error={errors.categoryId} />
      </LabeledField>
    )
  }

  return (
    <>
      <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <FormCard className="!gap-[18px]">
          <LabeledField label="Name" name="title" error={errors.title}>
            <input
              id={fieldId('title')}
              value={values.title}
              maxLength={TITLE_MAX}
              aria-invalid={errors.title ? true : undefined}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Unit 2 test"
              className={`${FIELD_INPUT} !py-3 !text-[17px]`}
            />
          </LabeledField>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3.5">
            {countsToward}
            <LabeledField
              label="Out of"
              name="maxScore"
              error={standalone ? undefined : errors.maxScore}
              hint={standalone ? 'Change it in Grades.' : undefined}
            >
              {standalone ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-700">
                  {standaloneMax != null ? points(standaloneMax) : '—'}
                </p>
              ) : (
                <OutOfInput
                  value={values.maxScore}
                  onChange={(maxScore) => set({ maxScore })}
                  error={errors.maxScore}
                  disabled={kindergarten}
                />
              )}
            </LabeledField>
            <LabeledField label="Date" name="date" error={errors.date}>
              <input
                id={fieldId('date')}
                type="date"
                value={values.date}
                aria-invalid={errors.date ? true : undefined}
                onChange={(e) => set({ date: e.target.value })}
                className={FIELD_INPUT}
              />
            </LabeledField>
          </div>
          {!standalone && !kindergarten && categories.length > 0 && (
            // What "Counts toward" lists, and how to add work under a single assessment.
            <p className="-mt-1.5 text-xs leading-relaxed text-slate-500">
              &ldquo;Counts toward&rdquo; lists categories: multiple assessments that hold several, like {categories[0].name}. To
              add work under a single assessment, edit it in <CategoriesLink classId={classId} /> and tick &ldquo;Make this a
              multiple assessment&rdquo;.
            </p>
          )}
          <LabeledField label="Note for students and parents" name="instructions" optional error={errors.instructions}>
            <textarea
              id={fieldId('instructions')}
              rows={3}
              value={values.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
              placeholder="e.g. Covers pages 30–52. Bring a pencil and an eraser."
              className={`${FIELD_INPUT} resize-y leading-relaxed`}
            />
          </LabeledField>
          <AttachmentsEditor state={props.attachments} optional />
        </FormCard>
        <p className="text-[13px] leading-relaxed text-slate-500">{info}</p>
      </section>

      <aside className="flex flex-[1_1_340px] flex-col gap-4">
        <FormCard className="!gap-3.5 sm:!p-5">
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
          <CheckboxRow checked={values.showEarly} onChange={(showEarly) => set({ showEarly })}>
            Show it to students and parents before the date{' '}
            <span className="text-slate-500">· on their calendar and &quot;Coming up&quot;</span>
          </CheckboxRow>
          <EmailOptionsField variant="assessment" values={values} set={set} studentCount={studentCount} />
        </FormCard>
        <StudentsSeePreview title={values.title} subject={subject} date={isCalendarDate(values.date) ? values.date : ''} />
      </aside>
    </>
  )
}
