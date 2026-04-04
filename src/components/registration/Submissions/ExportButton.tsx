'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportSubmissions } from '@/services/registrationService';
import type { SubmissionFilters } from '@/services/types/registration';

interface Props {
  formId: string;
  filters: SubmissionFilters;
}

export default function ExportButton({ formId, filters }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSubmissions(formId, filters);
    } catch {
      alert('Failed to export submissions');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <ArrowDownTrayIcon className="w-4 h-4" />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
