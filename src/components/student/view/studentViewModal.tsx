// File: src/components/student/view/studentViewModal.tsx
'use client'

import { useState, useEffect } from 'react';
import Modal from '../../shared/modal';
import { StudentPayload } from '@/services/types/student';
import { getTeacherById } from '@/services/teacherService';
import { getGradeDisplayName, getSchoolName } from '@/lib/schoolUtils';
import {
  AcademicCapIcon,
  ArchiveBoxIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  /** Optional: switch straight from viewing to editing this student. */
  onEdit?: () => void;
}

/** Treat blanks and the literal "N/A" placeholder the roster uses as "no value". */
const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'n/a') return null;
  return trimmed;
};

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Small uppercase section heading — the only structural device in the modal. */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</h3>
);

/**
 * An email or phone number rendered as something you can actually act on:
 * a mailto:/tel: link with a copy button that confirms in place.
 */
const ContactLine = ({
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
const GuardianCard = ({
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

const StudentViewModal: React.FC<StudentViewModalProps> = ({ isOpen, onClose, student, onEdit }) => {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(false);

  useEffect(() => {
    if (!student.homeroomTeacherId) {
      setTeacherName(null);
      return;
    }
    let cancelled = false;
    const fetchTeacher = async () => {
      setTeacherLoading(true);
      try {
        const res = await getTeacherById(student.homeroomTeacherId!);
        if (!cancelled && res.status === 'success') {
          setTeacherName(res.data.fullName);
        }
      } catch (err) {
        console.error('Error fetching teacher', err);
      } finally {
        if (!cancelled) setTeacherLoading(false);
      }
    };
    fetchTeacher();
    return () => {
      cancelled = true;
    };
  }, [student.homeroomTeacherId]);

  const emergency = clean(student.emergencyContact);

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      {/* Identity */}
      <header className="border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-6 pt-6 pb-5">
        <div className="flex items-center gap-4 pr-8">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-semibold tracking-wide text-white shadow-sm">
            {initialsOf(student.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-900">{student.name}</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {getSchoolName(student.school)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
            <AcademicCapIcon className="h-4 w-4" />
            {student.grade ? getGradeDisplayName(student.grade) : 'No grade'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-sm text-slate-600 ring-1 ring-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              OEN
            </span>
            <span className="font-mono">{clean(student.oen) ?? '—'}</span>
          </span>
          {student.isArchived && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700">
              <ArchiveBoxIcon className="h-4 w-4" />
              Archived {student.archivedAt ? formatDate(student.archivedAt) : ''}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-6 px-6 py-5">
        {/* Homeroom */}
        <section className="space-y-2">
          <SectionLabel>Homeroom</SectionLabel>
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            {teacherLoading ? (
              <span className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            ) : teacherName ? (
              <span className="text-slate-700">{teacherName}</span>
            ) : (
              <span className="text-slate-400">No homeroom teacher assigned</span>
            )}
          </div>
        </section>

        {/* Guardians */}
        <section className="space-y-2">
          <SectionLabel>Guardians</SectionLabel>
          <div className="space-y-2">
            <GuardianCard role="Mother" person={student.mother} />
            <GuardianCard role="Father" person={student.father} />
          </div>
        </section>

        {/* Emergency */}
        <section className="space-y-2">
          <SectionLabel>Emergency contact</SectionLabel>
          {emergency ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-sm text-amber-900">{emergency}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No emergency contact on file</p>
          )}
        </section>
      </div>

      {/* Record trail + actions */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <p className="text-xs text-slate-400">
          Added {formatDate(student.createdAt)} · Updated {formatDate(student.lastModifiedAt)}
        </p>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
          >
            Close
          </button>
        </div>
      </footer>
    </Modal>
  );
};

export default StudentViewModal;
