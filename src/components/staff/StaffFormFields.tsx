'use client'

import React from 'react'
import { Field, FieldRow, FormSection, inputClass, selectClass } from '../shared/modalKit'

/**
 * Every field on a staff directory record, in one place.
 *
 * Add and Edit ask for exactly the same information, so they share this rather
 * than keeping two copies of nine inputs in sync by hand. The fields are grouped
 * the way the directory reads: who the person is and what they teach, then how
 * to reach them and when.
 *
 * `onChange` is the raw change event rather than a (field, value) pair because
 * both modals drive their state off the input's `name` attribute; keeping that
 * contract leaves their submit payloads untouched.
 */

export interface StaffFormValues {
  school: string
  fullName: string
  staffRole: string
  /**
   * The raw comma-separated text the user types. It is split into a string[]
   * at the submit boundary — keeping it as an array in form state meant the
   * text input wrote a plain string into it and submit threw on .map().
   */
  teachingAssignments?: string
  homeroomGrade?: string
  email?: string
  phone?: string
  preferredContact?: string
  phoneContactHours?: string
  emailContactHours?: string
}

export const emptyStaffForm: StaffFormValues = {
  school: '',
  fullName: '',
  staffRole: '',
  teachingAssignments: '',
  homeroomGrade: '',
  email: '',
  phone: '',
  preferredContact: '',
  phoneContactHours: '',
  emailContactHours: '',
}

interface StaffFormFieldsProps {
  values: StaffFormValues
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  /** Prefix for input ids, so two forms can coexist on a page without colliding. */
  idPrefix: string
}

const StaffFormFields: React.FC<StaffFormFieldsProps> = ({ values, onChange, idPrefix }) => {
  const id = (field: string) => `${idPrefix}-${field}`

  return (
    <>
      <FormSection label="Staff member">
        <FieldRow>
          <Field label="Full name" htmlFor={id('full-name')} required>
            <input
              id={id('full-name')}
              type="text"
              name="fullName"
              value={values.fullName}
              onChange={onChange}
              placeholder="e.g. Amina Khalid"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Staff role" htmlFor={id('staff-role')} required>
            <input
              id={id('staff-role')}
              type="text"
              name="staffRole"
              value={values.staffRole}
              onChange={onChange}
              placeholder="e.g. Teacher, Principal, Secretary"
              className={inputClass}
              required
            />
          </Field>
        </FieldRow>

        <Field
          label="Teaching assignments"
          htmlFor={id('teaching-assignments')}
          hint="Separate multiple assignments with commas."
        >
          <input
            id={id('teaching-assignments')}
            type="text"
            name="teachingAssignments"
            value={values.teachingAssignments}
            onChange={onChange}
            placeholder="e.g. Math Grade 5, Science Grade 6"
            className={inputClass}
          />
        </Field>

        <Field label="Homeroom grade" htmlFor={id('homeroom-grade')}>
          <select
            id={id('homeroom-grade')}
            name="homeroomGrade"
            value={values.homeroomGrade}
            onChange={onChange}
            className={selectClass}
          >
            <option value="">Not assigned</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
              <option key={grade} value={grade.toString()}>
                {grade}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection label="Contact">
        <FieldRow>
          <Field label="Email" htmlFor={id('email')}>
            <input
              id={id('email')}
              type="email"
              name="email"
              value={values.email}
              onChange={onChange}
              placeholder="amina@school.org"
              className={inputClass}
            />
          </Field>

          <Field label="Phone" htmlFor={id('phone')}>
            <input
              id={id('phone')}
              type="tel"
              name="phone"
              value={values.phone}
              onChange={onChange}
              placeholder="416-654-0340"
              className={inputClass}
            />
          </Field>
        </FieldRow>

        <Field label="Preferred contact method" htmlFor={id('preferred-contact')}>
          <select
            id={id('preferred-contact')}
            name="preferredContact"
            value={values.preferredContact}
            onChange={onChange}
            className={selectClass}
          >
            <option value="">No preference</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="Both">Both</option>
          </select>
        </Field>

        <FieldRow>
          <Field label="Phone contact hours" htmlFor={id('phone-hours')}>
            <input
              id={id('phone-hours')}
              type="text"
              name="phoneContactHours"
              value={values.phoneContactHours}
              onChange={onChange}
              placeholder="e.g. 9 AM - 3 PM weekdays"
              className={inputClass}
            />
          </Field>

          <Field label="Email contact hours" htmlFor={id('email-hours')}>
            <input
              id={id('email-hours')}
              type="text"
              name="emailContactHours"
              value={values.emailContactHours}
              onChange={onChange}
              placeholder="e.g. 24 hours, check daily"
              className={inputClass}
            />
          </Field>
        </FieldRow>
      </FormSection>
    </>
  )
}

export default StaffFormFields
