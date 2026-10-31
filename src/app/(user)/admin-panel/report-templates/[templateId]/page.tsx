'use client';

import { use } from 'react';
import DesignerShell from '@/components/report-designer/DesignerShell';

export default function ReportTemplateEditorPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params);
  return <DesignerShell templateId={templateId} />;
}
