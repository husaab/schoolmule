'use client';

import { useState } from 'react';
import type { FormField, FieldType } from '@/services/types/registration';
import type { PaymentFieldConfig } from '@/services/types/registration';
import type { LiveTaxRate } from '@/services/types/payments';
import Modal from '@/components/shared/modal';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import PaymentFieldEditor from './PaymentFieldEditor';
import { defaultPaymentConfig, paymentConfigProblem } from '@/lib/paymentField';

interface Props {
  field: FormField | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
  /** Whether the school can take card payments now (for a payment field); null while unknown. */
  paymentsOnline?: boolean | null;
  /** The school's live tax rates (for a payment field); null while unknown. */
  taxRates?: LiveTaxRate[] | null;
}

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Text Input',
  email: 'Email Input',
  phone: 'Phone Input',
  date: 'Date Picker',
  select: 'Dropdown Select',
  radio: 'Radio Buttons',
  textarea: 'Long Text Area',
  payment: 'Payment',
};

export default function FieldEditor(props: Props) {
  if (!props.field) return null;
  // A fresh editor for each field, so its state starts from the field itself.
  return <FieldEditorForm key={props.field.fieldId} {...props} field={props.field} />;
}

function FieldEditorForm({ field, isOpen, onClose, onSave, paymentsOnline = null, taxRates = null }: Props & { field: FormField }) {
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [isRequired, setIsRequired] = useState(field.isRequired);
  const [options, setOptions] = useState<string[]>(field.options || []);
  const [payment, setPayment] = useState<PaymentFieldConfig>(() => field.payment ?? defaultPaymentConfig());

  const hasOptions = field.fieldType === 'select' || field.fieldType === 'radio';
  const isPayment = field.fieldType === 'payment';
  const paymentProblem = isPayment ? paymentConfigProblem(payment) : null;

  const handleSave = () => {
    onSave({
      ...field,
      label: label.trim(),
      placeholder: isPayment ? null : placeholder.trim() || null,
      isRequired: isPayment ? false : isRequired,
      options: hasOptions ? options.filter(o => o.trim()) : null,
      payment: isPayment ? { ...payment, items: payment.items.map((i) => ({ ...i, label: i.label.trim() })) } : null,
    });
    onClose();
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Field" size="lg">
      <div className="space-y-5 px-6 py-4">
        {/* Field Type (read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Field Type</label>
          <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200">
            {fieldTypeLabels[field.fieldType]}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Name of student as it appears on their birth certificate"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Placeholder */}
        {!isPayment && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="e.g. Your answer"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        )}

        {/* Required Toggle (a payment field is required through its items) */}
        {!isPayment && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRequired(!isRequired)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isRequired ? 'bg-cyan-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isRequired ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <label className="text-sm text-slate-700">Required field</label>
        </div>
        )}

        {isPayment && <PaymentFieldEditor config={payment} onChange={setPayment} online={paymentsOnline} taxRates={taxRates} />}

        {/* Options (for select/radio) */}
        {hasOptions && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 font-medium mt-1"
              >
                <PlusIcon className="w-4 h-4" />
                Add option
              </button>
            </div>
          </div>
        )}

        {paymentProblem && payment.items.some((i) => i.label.trim() || i.amountCents > 0) && (
          <p role="alert" className="text-sm text-rose-600">{paymentProblem}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim() || Boolean(paymentProblem)}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Field
          </button>
        </div>
      </div>
    </Modal>
  );
}
