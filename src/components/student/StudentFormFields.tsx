// File: src/components/student/StudentFormFields.tsx
'use client'

import React from 'react'
import { TeacherPayload } from '@/services/types/teacher'
import { getGradeOptions, GradeValue } from '@/lib/schoolUtils'
import {
  Field,
  FieldRow,
  FormSection,
  inputClass,
  selectClass,
  textareaClass,
} from '../shared/modalKit'

/**
 * Every field on a student record, in one place.
 *
 * Add and Edit ask for exactly the same information, so they share this rather
 * than keeping two copies of fourteen inputs in sync by hand. The fields are
 * grouped the way an office actually works through them: who the student is,
 * who teaches them, who to call, and what to know in an emergency.
 */

export interface StudentFormValues {
  name: string
  grade: GradeValue | ''
  oen: string
  dateOfBirth: string
  healthCardNumber: string
  homeroomTeacherId: string
  motherName: string
  motherEmail: string
  motherPhone: string
  fatherName: string
  fatherEmail: string
  fatherPhone: string
  emergencyContact: string
  address: string
  medicalNotes: string
}

export const emptyStudentForm: StudentFormValues = {
  name: '',
  grade: '',
  oen: '',
  dateOfBirth: '',
  healthCardNumber: '',
  homeroomTeacherId: '',
  motherName: '',
  motherEmail: '',
  motherPhone: '',
  fatherName: '',
  fatherEmail: '',
  fatherPhone: '',
  emergencyContact: '',
  address: '',
  medicalNotes: '',
}

interface StudentFormFieldsProps {
  values: StudentFormValues
  onChange: <K extends keyof StudentFormValues>(field: K, value: StudentFormValues[K]) => void
  teachers: TeacherPayload[]
  /** Prefix for input ids, so two forms can coexist on a page without colliding. */
  idPrefix: string
}

const StudentFormFields: React.FC<StudentFormFieldsProps> = ({
  values,
  onChange,
  teachers,
  idPrefix,
}) => {
  const id = (field: string) => `${idPrefix}-${field}`

  return (
    <>
      <FormSection label="Student">
        <Field label="Full name" htmlFor={id('name')} required>
          <input
            id={id('name')}
            required
            value={values.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g. Fatima Hussein"
            className={inputClass}
          />
        </Field>

        <FieldRow>
          <Field label="Grade" htmlFor={id('grade')} required>
            <select
              id={id('grade')}
              required
              value={values.grade}
              onChange={(e) => onChange('grade', e.target.value as GradeValue)}
              className={selectClass}
            >
              <option value="" disabled>
                Select grade
              </option>
              {getGradeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date of birth" htmlFor={id('dob')}>
            <input
              id={id('dob')}
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className={selectClass}
            />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="OEN" htmlFor={id('oen')}>
            <input
              id={id('oen')}
              value={values.oen}
              onChange={(e) => onChange('oen', e.target.value)}
              placeholder="423-654-432"
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field label="Health card" htmlFor={id('health')}>
            <input
              id={id('health')}
              value={values.healthCardNumber}
              onChange={(e) => onChange('healthCardNumber', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </Field>
        </FieldRow>

        <Field label="Homeroom teacher" htmlFor={id('homeroom')}>
          <select
            id={id('homeroom')}
            value={values.homeroomTeacherId}
            onChange={(e) => onChange('homeroomTeacherId', e.target.value)}
            className={selectClass}
          >
            <option value="">Not assigned</option>
            {teachers.map((t) => (
              <option key={t.userId} value={t.userId}>
                {t.fullName}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection label="Mother">
        <Field label="Name" htmlFor={id('mother-name')}>
          <input
            id={id('mother-name')}
            value={values.motherName}
            onChange={(e) => onChange('motherName', e.target.value)}
            className={inputClass}
          />
        </Field>
        <FieldRow>
          <Field label="Email" htmlFor={id('mother-email')}>
            <input
              id={id('mother-email')}
              type="email"
              value={values.motherEmail}
              onChange={(e) => onChange('motherEmail', e.target.value)}
              placeholder="marydoe@gmail.com"
              className={inputClass}
            />
          </Field>
          <Field label="Phone" htmlFor={id('mother-phone')}>
            <input
              id={id('mother-phone')}
              type="tel"
              value={values.motherPhone}
              onChange={(e) => onChange('motherPhone', e.target.value)}
              placeholder="416-654-0340"
              className={inputClass}
            />
          </Field>
        </FieldRow>
      </FormSection>

      <FormSection label="Father">
        <Field label="Name" htmlFor={id('father-name')}>
          <input
            id={id('father-name')}
            value={values.fatherName}
            onChange={(e) => onChange('fatherName', e.target.value)}
            className={inputClass}
          />
        </Field>
        <FieldRow>
          <Field label="Email" htmlFor={id('father-email')}>
            <input
              id={id('father-email')}
              type="email"
              value={values.fatherEmail}
              onChange={(e) => onChange('fatherEmail', e.target.value)}
              placeholder="johndoe@gmail.com"
              className={inputClass}
            />
          </Field>
          <Field label="Phone" htmlFor={id('father-phone')}>
            <input
              id={id('father-phone')}
              type="tel"
              value={values.fatherPhone}
              onChange={(e) => onChange('fatherPhone', e.target.value)}
              placeholder="416-654-0340"
              className={inputClass}
            />
          </Field>
        </FieldRow>
      </FormSection>

      <FormSection label="Home & emergency">
        <Field label="Address" htmlFor={id('address')}>
          <textarea
            id={id('address')}
            rows={2}
            value={values.address}
            onChange={(e) => onChange('address', e.target.value)}
            className={textareaClass}
          />
        </Field>

        <Field
          label="Emergency contact"
          htmlFor={id('emergency')}
          hint="Who to call when neither parent can be reached."
        >
          <input
            id={id('emergency')}
            value={values.emergencyContact}
            onChange={(e) => onChange('emergencyContact', e.target.value)}
            placeholder="Name and phone number"
            className={inputClass}
          />
        </Field>

        <Field
          label="Medical & allergy notes"
          htmlFor={id('medical')}
          hint="Shown to staff on the student's record."
        >
          <textarea
            id={id('medical')}
            rows={2}
            value={values.medicalNotes}
            onChange={(e) => onChange('medicalNotes', e.target.value)}
            placeholder="e.g. Peanut allergy — EpiPen in the office"
            className={textareaClass}
          />
        </Field>
      </FormSection>
    </>
  )
}

export default StudentFormFields
