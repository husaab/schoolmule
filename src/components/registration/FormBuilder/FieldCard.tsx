'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormField } from '@/services/types/registration';
import {
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const fieldTypeLabels: Record<string, string> = {
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  date: 'Date',
  select: 'Dropdown',
  radio: 'Radio',
  textarea: 'Long Text',
};

interface Props {
  field: FormField;
  onEdit: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
}

export default function FieldCard({ field, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 group hover:border-cyan-200 hover:shadow-sm transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 truncate">
            {field.label || 'Untitled Field'}
          </span>
          {field.isRequired && (
            <span className="text-red-500 text-xs font-bold">*</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">
            {fieldTypeLabels[field.fieldType] || field.fieldType}
          </span>
          {field.options && field.options.length > 0 && (
            <span className="text-xs text-slate-400">
              ({field.options.length} options)
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(field.fieldId)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(field.fieldId)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
