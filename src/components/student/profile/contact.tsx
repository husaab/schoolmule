'use client'

// Contact building blocks for the student profile: tap-to-call/email lines
// with a copy button, and a guardian card built from them.

import { useEffect, useState } from 'react';
import { CheckIcon, ClipboardDocumentIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

/** Treat blanks and the literal "N/A" placeholder the roster uses as "no value". */
export const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'n/a') return null;
  return trimmed;
};

/** Small uppercase section heading. */
export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</h3>
);

/**
 * An email or phone number rendered as something you can actually act on:
 * a mailto:/tel: link with a copy button that confirms in place.
 */
export const ContactLine = ({
  kind,
  value,
}: {
  kind: 'email' | 'phone';
  value: string | null;
}) => {
  const [copied, setCopied] = useState(false);
  const Icon = kind === 'email' ? EnvelopeIcon : PhoneIcon;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>No {kind} on file</span>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (err) {
      console.error('Could not copy to clipboard', err);
    }
  };

  return (
    <div className="group/line flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white">
      <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
      <a
        href={kind === 'email' ? `mailto:${value}` : `tel:${value.replace(/[^\d+]/g, '')}`}
        className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-cyan-700 hover:underline"
        title={value}
      >
        {value}
      </a>
      <button
        type="button"
        onClick={copy}
        title={copied ? 'Copied' : `Copy ${kind}`}
        aria-label={copied ? 'Copied' : `Copy ${kind}`}
        className="flex-shrink-0 cursor-pointer rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 group-hover/line:opacity-100"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-emerald-600" />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

/** One guardian: who they are, and the two ways to reach them. */
export const GuardianCard = ({
  role,
  person,
}: {
  role: string;
  person: { name: string | null; email: string | null; phone: string | null };
}) => {
  const name = clean(person.name);
  const email = clean(person.email);
  const phone = clean(person.phone);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-1.5">
      <div className="flex items-baseline justify-between gap-3 px-3 pt-2 pb-1">
        <span className="text-sm font-semibold text-slate-900">{name ?? 'Not on file'}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {role}
        </span>
      </div>
      <ContactLine kind="email" value={email} />
      <ContactLine kind="phone" value={phone} />
    </div>
  );
};
