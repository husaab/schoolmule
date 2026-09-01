// File: src/components/shared/modalKit.tsx
'use client'

import React from 'react'

/**
 * Shared building blocks for every modal in the app.
 *
 * The pieces here exist so that a form modal, a confirmation, and a detail
 * view all read as the same object: one header treatment, one field style, one
 * action bar. Reach for these instead of hand-rolling markup — a modal that
 * styles its own inputs is how the set drifts apart.
 *
 * Header and footer are sticky inside the scroll container, so a long form
 * keeps its title and its Save button in view while the fields scroll.
 */

type Tone = 'brand' | 'danger' | 'warning' | 'success' | 'violet'

const headerToneClasses: Record<Tone, string> = {
  brand: 'from-cyan-50 via-white to-teal-50',
  danger: 'from-rose-50 via-white to-rose-50/40',
  warning: 'from-amber-50 via-white to-amber-50/40',
  success: 'from-emerald-50 via-white to-emerald-50/40',
  violet: 'from-violet-50 via-white to-purple-50/40',
}

const iconToneClasses: Record<Tone, string> = {
  brand: 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white',
  danger: 'bg-rose-100 text-rose-600',
  warning: 'bg-amber-100 text-amber-600',
  success: 'bg-emerald-100 text-emerald-600',
  violet: 'bg-violet-100 text-violet-600',
}

interface ModalHeaderProps {
  title: string
  /** One line on what this modal does or which record it acts on. */
  subtitle?: React.ReactNode
  /** Heroicon component, rendered in a tinted tile beside the title. */
  icon?: React.ComponentType<{ className?: string }>
  tone?: Tone
}

export const ModalHeader = ({ title, subtitle, icon: Icon, tone = 'brand' }: ModalHeaderProps) => (
  <header
    className={`sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br px-6 py-5 ${headerToneClasses[tone]}`}
  >
    {/* pr-10 keeps the title clear of the shared Modal's close button. */}
    <div className="flex items-center gap-3 pr-10">
      {Icon && (
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${iconToneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  </header>
)

export const ModalBody = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => <div className={`space-y-5 px-6 py-5 ${className}`}>{children}</div>

export const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <footer className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
    {children}
  </footer>
)

/** Groups related fields under a quiet uppercase label. */
export const FormSection = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <section className="space-y-3">
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</h3>
    {children}
  </section>
)

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export const Field = ({ label, htmlFor, hint, required, children }: FieldProps) => (
  <div>
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
)

/** Two fields side by side on anything wider than a phone. */
export const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
)

const controlBase =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60'

export const inputClass = controlBase
export const textareaClass = `${controlBase} resize-y`
export const selectClass = `${controlBase} cursor-pointer`

const variantClasses = {
  primary:
    'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm hover:from-cyan-600 hover:to-teal-600',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  warning: 'bg-amber-600 text-white shadow-sm hover:bg-amber-700',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  violet:
    'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm hover:from-violet-600 hover:to-purple-600',
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses
  loading?: boolean
}

export const Button = ({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
  >
    {loading && (
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    )}
    {children}
  </button>
)

/**
 * The body of a confirmation modal: what is about to happen, to what, and — when
 * it is worth spelling out — what the consequences actually are.
 */
export const ConfirmBody = ({
  children,
  consequences,
  tone = 'danger',
}: {
  children: React.ReactNode
  consequences?: { title: string; items: string[] }
  tone?: Tone
}) => {
  const panelTone: Record<Tone, string> = {
    brand: 'border-cyan-100 bg-cyan-50/70 text-cyan-900',
    danger: 'border-rose-100 bg-rose-50/70 text-rose-900',
    warning: 'border-amber-100 bg-amber-50/70 text-amber-900',
    success: 'border-emerald-100 bg-emerald-50/70 text-emerald-900',
    violet: 'border-violet-100 bg-violet-50/70 text-violet-900',
  }

  return (
    <>
      <p className="text-sm leading-relaxed text-slate-600">{children}</p>
      {consequences && (
        <div className={`rounded-xl border px-4 py-3 ${panelTone[tone]}`}>
          <p className="text-sm font-medium">{consequences.title}</p>
          <ul className="mt-2 space-y-1.5">
            {consequences.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm opacity-90">
                <span aria-hidden="true">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

/** A compact read-only fact, for showing which record a confirmation applies to. */
export const RecordFacts = ({ facts }: { facts: { label: string; value: React.ReactNode }[] }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-4 py-3">
    {facts.map((f) => (
      <div key={f.label}>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {f.label}
        </dt>
        <dd className="mt-0.5 truncate text-sm text-slate-700">{f.value}</dd>
      </div>
    ))}
  </dl>
)
