'use client';

import type { FieldType } from '@/services/types/registration';
import {
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';

interface FieldTypeOption {
  type: FieldType;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const FIELD_TYPES: FieldTypeOption[] = [
  { type: 'text', label: 'Text', icon: DocumentTextIcon },
  { type: 'email', label: 'Email', icon: EnvelopeIcon },
  { type: 'phone', label: 'Phone', icon: PhoneIcon },
  { type: 'date', label: 'Date', icon: CalendarDaysIcon },
  { type: 'select', label: 'Dropdown', icon: ChevronDownIcon },
  { type: 'radio', label: 'Radio', icon: ListBulletIcon },
  { type: 'textarea', label: 'Long Text', icon: Bars3BottomLeftIcon },
];

interface Props {
  onAdd: (type: FieldType) => void;
}

export default function FieldTypeSelector({ onAdd }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Field</h3>
      <div className="space-y-1.5">
        {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
