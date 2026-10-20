'use client'

// "Request an account" for a student with no login yet. No session is made:
// the school's office matches the request to the student's record on the
// Approvals page, and the student gets the normal invite email. The answer is
// the same "request sent" whether or not anything was stored.

import { FC, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import Link from 'next/link'
import { requestStudentAccount } from '@/services/authService'
import type { SignupSchool } from '@/lib/schoolUtils'
import { GRADE_OPTIONS } from '@/lib/studentAccounts'
import { requestSubmitError, validateRequestForm, type RequestFormValues } from '@/lib/studentRequests'
import type { GradeCode } from '@/services/types/studentAccount'
import { AcademicCapIcon, CheckCircleIcon, EnvelopeIcon, ExclamationCircleIcon, UserIcon } from '@heroicons/react/24/outline'

interface FormInputs extends RequestFormValues {
  website?: string // Honeypot field
}

const inputClass = 'w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400'
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2'
const iconClass = 'absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'

const StudentRequestForm: FC<{ school: SignupSchool }> = ({ school }) => {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({ defaultValues: { firstName: '', lastName: '', grade: '', email: '' } })

  const field = (name: keyof RequestFormValues) => ({
    validate: (_: unknown, all: FormInputs) => validateRequestForm(all)[name] ?? true,
  })

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setRefusal(null)
    try {
      await requestStudentAccount({
        school: school.schoolCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        grade: data.grade as GradeCode,
        email: data.email.trim(),
        website: data.website,
      })
      setSentTo(data.email.trim().toLowerCase())
    } catch (err) {
      setRefusal(requestSubmitError(err))
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircleIcon className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-slate-900">Request sent</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {school.name} will check it and email an invite to{' '}
          <span className="font-semibold text-slate-900">{sentTo}</span>. Open that email to set up your account.
        </p>
        <p className="mt-3 text-xs text-slate-500">No email after a few days? Ask your teacher or the school office.</p>
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {refusal && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">
          <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span>{refusal}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>First name</label>
          <div className="relative">
            <div className={iconClass}><UserIcon className="h-5 w-5 text-slate-400" /></div>
            <input id="firstName" type="text" autoComplete="given-name" {...register('firstName', field('firstName'))} className={inputClass} />
          </div>
          {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Last name</label>
          <div className="relative">
            <div className={iconClass}><UserIcon className="h-5 w-5 text-slate-400" /></div>
            <input id="lastName" type="text" autoComplete="family-name" {...register('lastName', field('lastName'))} className={inputClass} />
          </div>
          {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="grade" className={labelClass}>Grade</label>
        <div className="relative">
          <div className={iconClass}><AcademicCapIcon className="h-5 w-5 text-slate-400" /></div>
          <select id="grade" {...register('grade', field('grade'))} className={`${inputClass} appearance-none`}>
            <option value="" disabled>Choose your grade</option>
            {GRADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {errors.grade && <p className="mt-1 text-sm text-red-500">{errors.grade.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>School email</label>
        <div className="relative">
          <div className={iconClass}><EnvelopeIcon className="h-5 w-5 text-slate-400" /></div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.org"
            {...register('email', field('email'))}
            className={inputClass}
          />
        </div>
        {errors.email ? (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">Your own school address, not a parent&apos;s. Your invite goes here.</p>
        )}
      </div>

      {/* Honeypot field - hidden from humans, bots will fill it */}
      <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Sending…' : 'Request an account'}
      </button>
      <p className="text-center text-xs text-slate-400">The school checks every request before an account is made.</p>
    </form>
  )
}

export default StudentRequestForm
