import type { RatingScale } from '../types';

/** Rating scales the legacy report templates printed, as presets. */
export const SCALES = {
  jkProgress: {
    id: 'jk-progress',
    name: 'JK progress',
    levels: [
      { code: 'D', label: 'Developing', description: 'Children can apply the skill or concept correctly.' },
      { code: 'B', label: 'Beginning', description: 'Children show some understanding. Reminders, hints, or support may be needed.' },
      { code: 'I', label: 'Improvement needed', description: 'Children are experiencing difficulty with the concept or skill. Assistance at home is needed.' },
      { code: 'N', label: 'Not Assessed', description: 'Not assessed at this time' },
    ],
  },
  skProgress: {
    id: 'sk-progress',
    name: 'SK progress',
    levels: [
      { code: 'E', label: 'Excellent' },
      { code: 'G', label: 'Good' },
      { code: 'S', label: 'Satisfactory' },
      { code: 'NI', label: 'Needs Improvement' },
      { code: 'NA', label: 'Not Applicable' },
    ],
  },
  jkCard: {
    id: 'jk-card',
    name: 'JK report card',
    levels: [
      { code: 'BG', label: 'Beginning' },
      { code: 'DV', label: 'Developing' },
      { code: 'NI', label: 'Needs Improvement' },
    ],
  },
  skCard: {
    id: 'sk-card',
    name: 'SK report card',
    levels: [
      { code: 'E', label: 'Exemplary' },
      { code: 'P', label: 'Proficient' },
      { code: 'DV', label: 'Developing' },
      { code: 'EM', label: 'Emerging' },
      { code: 'NI', label: 'Needs Improvement' },
      { code: 'N/A', label: 'Not Assessed' },
    ],
  },
  egsnProgress: {
    id: 'egsn-progress',
    name: 'Work habits & behaviour (E/G/S/N)',
    levels: [
      { code: 'E', label: 'Excellent', color: '#d4edda', textColor: '#155724' },
      { code: 'G', label: 'Good', color: '#cce7ff', textColor: '#0066cc' },
      { code: 'S', label: 'Satisfactory', color: '#fff3cd', textColor: '#856404' },
      { code: 'N', label: 'Needs Improvement', color: '#f8d7da', textColor: '#721c24' },
    ],
  },
  egsn: {
    id: 'egsn',
    name: 'Learning skills (E/G/S/N)',
    levels: [
      { code: 'E', label: 'Excellent', color: '#d4edda', textColor: '#155724' },
      { code: 'G', label: 'Good', color: '#d1ecf1', textColor: '#0c5460' },
      { code: 'S', label: 'Satisfactory', color: '#fff3cd', textColor: '#856404' },
      { code: 'N', label: 'Needs Improvement', color: '#f8d7da', textColor: '#721c24' },
    ],
  },
  /** The grades 1–8 report card and progress report: muted tints, every letter at least 4.5:1 on its tint. */
  honourRoll: {
    id: 'egsn-honour-roll',
    name: 'Work habits & behaviour (E/G/S/N)',
    levels: [
      { code: 'E', label: 'Excellent', color: '#ddebdd', textColor: '#1e5a2f' },
      { code: 'G', label: 'Good', color: '#dce7f4', textColor: '#0f4478' },
      { code: 'S', label: 'Satisfactory', color: '#f6eccb', textColor: '#6b5000' },
      { code: 'N', label: 'Needs Improvement', color: '#f3ddda', textColor: '#7c2a22' },
    ],
  },
} satisfies Record<string, RatingScale>;
