import type { DocType, TemplateDoc } from '../types';
import { kindergartenProgressTemplate } from './kindergartenProgress';
import { kindergartenReportCardTemplate } from './kindergartenReportCard';
import { progressStandardTemplate } from './progressStandard';
import { reportCardStandardTemplate } from './reportCardStandard';

const GRADES_1_TO_8 = ['1', '2', '3', '4', '5', '6', '7', '8'];

/**
 * SchoolMule's built-in templates. A school starts on these; "Customize"
 * copies one into the school's own editable template. `key` is stable —
 * stored on materialised versions and assignments.
 */
export interface DefaultTemplateDef {
  key: string;
  name: string;
  description: string;
  docType: DocType;
  /** Grades this default prints for when nothing else is assigned. */
  grades: string[];
  build: () => TemplateDoc;
}

export const DEFAULT_TEMPLATES: DefaultTemplateDef[] = [
  {
    key: 'progress-jk',
    name: 'JK progress report',
    description: 'Junior Kindergarten skills by domain with the D/B/I/N key, comments and signatures.',
    docType: 'progress_report',
    grades: ['JK'],
    build: () => kindergartenProgressTemplate('JK'),
  },
  {
    key: 'progress-sk',
    name: 'SK progress report',
    description: 'Senior Kindergarten skills by subject with the E/G/S/NI/NA key, comments and signatures.',
    docType: 'progress_report',
    grades: ['SK'],
    build: () => kindergartenProgressTemplate('SK'),
  },
  {
    key: 'progress-standard',
    name: 'Progress report',
    description: 'Grades 1–8: work habits, behaviour and overall per subject as coloured tiles, core standards and teacher comments.',
    docType: 'progress_report',
    grades: GRADES_1_TO_8,
    build: () => progressStandardTemplate(),
  },
  {
    key: 'report-card-standard',
    name: 'Report card',
    description: 'Grades 1–8: the work habits key and Ontario achievement chart, then each subject’s mark, work habits, behaviour and comments, two subjects per page.',
    docType: 'report_card',
    grades: GRADES_1_TO_8,
    build: () => reportCardStandardTemplate('standard'),
  },
  // Same grades as the standard card but listed after it, so it is never the
  // automatic default: it prints only for an explicit assignment.
  {
    key: 'report-card-t1t2final',
    name: 'Report card — First, Second and Final Term',
    description: 'Grades 1–8 final card: each subject shows First, Second and Final Term marks with each term’s work habits and behaviour.',
    docType: 'report_card',
    grades: GRADES_1_TO_8,
    build: () => reportCardStandardTemplate('t1t2final'),
  },
  {
    key: 'report-card-jk',
    name: 'JK report card',
    description: 'Junior Kindergarten: learning goals by domain for Term 1 and Term 2 with comments, then the Learning Skills page and signatures.',
    docType: 'report_card',
    grades: ['JK'],
    build: () => kindergartenReportCardTemplate('JK'),
  },
  {
    key: 'report-card-sk',
    name: 'SK report card',
    description: 'Senior Kindergarten: the E/P/DV/EM/NI rating scale, standards by subject for Term 1 and Term 2, strengths and next steps, and signatures.',
    docType: 'report_card',
    grades: ['SK'],
    build: () => kindergartenReportCardTemplate('SK'),
  },
];

export function defaultTemplate(key: string): TemplateDoc | null {
  return DEFAULT_TEMPLATES.find((d) => d.key === key)?.build() ?? null;
}
