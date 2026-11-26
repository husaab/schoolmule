// src/components/classes/items/AssessmentFields.tsx
// The assessment form (the Teacher-NewAssessment board, D11): a plain
// gradebook column (name, what it counts toward, marked out of, date) with an
// optional note and attachments, then topic, audience, "show it early" and
// the email, and what students will see. "Counts toward" is a category (one
// can be made right there) or "On its own" with its own "Worth"; a few plain
// sentences then say what the choices come to, so the share of the final
// grade is never mistaken for the marks. A column that already counts on its
// own stays on its own here (moving it into a category is done in Grades),
// but its "Worth" and "Marked out of" can be changed. Scores are entered in
// Grades; nothing is turned in.
'use client'

import AttachmentsEditor from './AttachmentsEditor'
import AudienceField from './AudienceField'
import EmailOptionsField from './EmailOptionsField'
import { CountsSummary, CountsTowardSelect, OutOfInput, WorthInput, WorthNote } from './GradebookLinkField'
import StudentsSeePreview from './StudentsSeePreview'
import { CheckboxRow, FIELD_INPUT, FormCard, LabeledField, TopicField, fieldId, type ItemFieldsProps } from './formParts'
import { CATEGORIES_PLACE, ON_ITS_OWN, countsSummary } from '@/lib/countsToward'
import { TITLE_MAX, isCalendarDate } from '@/lib/itemForm'

const READ_ONLY = 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-700'

export default function AssessmentFields(props: ItemFieldsProps) {
  const { classId, subject, studentCount, values, set, errors, topics, categories, standalone, kindergarten } = props
  // Its saved column counts on its own (it stays there), or "On its own" is the choice made here.
  const onItsOwn = standalone || values.gradebookMode === 'standalone'
  const category = onItsOwn ? undefined : categories.find((c) => c.assessmentId === values.categoryId)

  const summary = !kindergarten
    ? countsSummary({
        mode: onItsOwn ? 'standalone' : 'category',
        category: category ?? null,
        maxScore: values.maxScore,
        weightPoints: values.weightPoints,
        current: props.currentCategoryId ? { categoryId: props.currentCategoryId, weightPoints: props.currentWeightPoints } : null,
      })
    : []

  const where = onItsOwn ? 'a column of its own in Grades' : category ? `a column under ${category.name} in Grades` : 'a column in Grades'
  const info = `This is ${where}. Enter scores there (they save as you type), then Publish.`

  let countsToward
  if (standalone) {
    countsToward = (
      <LabeledField label="Counts toward" name="categoryId" hint={`Move it into a category in ${CATEGORIES_PLACE}.`}>
        <p className={READ_ONLY}>On its own</p>
      </LabeledField>
    )
  } else if (kindergarten) {
    countsToward = (
      // The note is the explanation: a save stops here and focuses it.
      <LabeledField label="Counts toward" name="categoryId">
        <p id={fieldId('categoryId')} tabIndex={-1} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-snug text-amber-900 outline-none">
          JK and SK are graded on skills, so there&apos;s no gradebook column to add here.
        </p>
      </LabeledField>
    )
  } else {
    countsToward = (
      <LabeledField
        label="Counts toward"
        name="categoryId"
        error={errors.categoryId}
        hint={
          // A class with no category yet: say so, and offer one without opening the list.
          categories.length === 0 ? (
            <>
              No categories yet.{' '}
              <button type="button" onClick={props.onNewCategory} className="cursor-pointer font-medium text-cyan-700 underline hover:text-cyan-800">
                Add a category
              </button>{' '}
              to group assessments, like Tests or Homework.
            </>
          ) : undefined
        }
      >
        <CountsTowardSelect
          categories={categories}
          value={onItsOwn ? ON_ITS_OWN : values.categoryId}
          onChange={(categoryId) => set({ gradebookMode: 'category', categoryId })}
          onOwn={() => set({ gradebookMode: 'standalone' })}
          onNewCategory={props.onNewCategory}
          error={errors.categoryId}
        />
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3.5">
            {countsToward}
            {onItsOwn && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={fieldId('weightPoints')} className="text-[13px] font-medium text-slate-600">
                  Worth <span className="font-normal text-slate-500">(% of final grade)</span>
                </label>
                <WorthInput
                  value={values.weightPoints}
                  onChange={(weightPoints) => set({ weightPoints })}
                  error={errors.weightPoints}
                  disabled={kindergarten}
                />
                <WorthNote pointsUsed={props.pointsUsed} value={values.weightPoints} error={errors.weightPoints} />
              </div>
            )}
            <LabeledField label="Marked out of" name="maxScore" error={errors.maxScore}>
              <OutOfInput value={values.maxScore} onChange={(maxScore) => set({ maxScore })} error={errors.maxScore} disabled={kindergarten} />
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
          <CountsSummary lines={summary} />
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
