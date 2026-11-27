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
  CreditCardIcon,
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
  { type: 'payment', label: 'Payment', icon: CreditCardIcon },
];

interface Props {
  onAdd: (type: FieldType) => void;
  /** A form takes one payment field: the button goes quiet once it has one. */
  hasPayment?: boolean;
}

export default function FieldTypeSelector({ onAdd, hasPayment = false }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Field</h3>
      <div className="space-y-1.5">
        {FIELD_TYPES.map(({ type, label, icon: Icon }) => {
          const taken = type === 'payment' && hasPayment;
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              disabled={taken}
              title={taken ? 'This form already has a payment field. Add every item to it.' : undefined}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {type === 'payment' && !taken && <span className="ml-auto rounded-full bg-amber-100 px-1.5 text-[10px] font-medium text-amber-800">New</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
