import { describe, expect, it } from 'vitest';
import { describeCondition, evaluateCondition } from './conditions';
import { DEFAULT_MARK_RULES, formatDate, formatMark, gradeLabel, gradeNumber, overallRating, termDisplay } from './format';
import { mergeFieldsIn, mergeHtml, mergeText } from './merge';

const scope = {
  student: { grade: 'SK', gradeNumber: 0, name: 'Sara Haddad', oen: '', daysAbsent: 4 },
  meta: { termNumber: 2, reportDate: '2026-11-13' },
  skills: [1, 2, 3],
  extra: { placement: 'Grade 1' },
};

describe('evaluateCondition', () => {
  it('treats a missing condition as shown', () => {
    expect(evaluateCondition(null, scope)).toBe(true);
    expect(evaluateCondition(undefined, scope)).toBe(true);
  });

  it('compares text case-insensitively and numbers numerically', () => {
    expect(evaluateCondition({ field: 'student.grade', op: 'eq', value: 'sk' }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'meta.termNumber', op: 'eq', value: '2' }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'student.grade', op: 'neq', value: 'JK' }, scope)).toBe(true);
  });

  it('supports in / notIn lists', () => {
    expect(evaluateCondition({ field: 'student.grade', op: 'in', value: ['JK', 'SK'] }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'student.grade', op: 'notIn', value: ['JK', 'SK'] }, scope)).toBe(false);
  });

  it('supports numeric comparisons, counting lists by length', () => {
    expect(evaluateCondition({ field: 'student.daysAbsent', op: 'gt', value: 3 }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'skills', op: 'gte', value: 3 }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'student.name', op: 'gt', value: 3 }, scope)).toBe(false);
  });

  it('supports empty / notEmpty', () => {
    expect(evaluateCondition({ field: 'student.oen', op: 'empty' }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'extra.placement', op: 'notEmpty' }, scope)).toBe(true);
    expect(evaluateCondition({ field: 'extra.missing', op: 'empty' }, scope)).toBe(true);
  });

  it('combines with and / or / not', () => {
    const cond = {
      op: 'and' as const,
      conditions: [
        { field: 'student.grade', op: 'in' as const, value: ['JK', 'SK'] },
        { op: 'not' as const, condition: { field: 'meta.termNumber', op: 'eq' as const, value: 1 } },
      ],
    };
    expect(evaluateCondition(cond, scope)).toBe(true);
    expect(evaluateCondition({ op: 'or', conditions: [] }, scope)).toBe(true);
  });

  it('describes conditions in words', () => {
    expect(describeCondition({ field: 'student.grade', op: 'in', value: ['JK', 'SK'] }, () => 'Grade')).toBe(
      'Grade is one of JK, SK',
    );
    expect(describeCondition(null)).toBe('Always shown');
  });
});

describe('formatMark (matches the legacy formatReportMark)', () => {
  const r = DEFAULT_MARK_RULES;
  it('prints letters for grades 1–3 and NN.N% for 4–8', () => {
    expect(formatMark(87.25, '2', r)).toBe('A');
    expect(formatMark(87.25, '4', r)).toBe('87.3%');
    expect(formatMark(89.5, '3', r)).toBe('A+');
  });
  it('prints R below 50 on the unrounded value', () => {
    expect(formatMark(49.6, '2', r)).toBe('R');
    expect(formatMark(49.6, '7', r)).toBe('R');
    expect(formatMark(50, '2', r)).toBe('D-');
  });
  it('prints I for no evidence and a dash for no mark', () => {
    expect(formatMark('I', '5', r)).toBe('I');
    expect(formatMark(null, '5', r)).toBe('—');
  });
});

describe('formatting helpers', () => {
  it('formats calendar dates without shifting the day', () => {
    expect(formatDate('2026-11-14')).toBe('November 14, 2026');
    expect(formatDate('2026-01-01', 'medium')).toBe('Jan 1, 2026');
    expect(formatDate('not a date')).toBe('not a date');
  });
  it('maps terms, grades and overall ratings like the legacy templates', () => {
    expect(termDisplay('Term 2')).toBe('SECOND TERM');
    expect(termDisplay('Summer')).toBe('SUMMER');
    expect(gradeLabel('SK')).toBe('Senior Kindergarten');
    expect(gradeLabel('4')).toBe('Grade 4');
    expect(gradeNumber('JK')).toBe(-1);
    expect(overallRating('E', 'G')).toBe('E');
    expect(overallRating('G', 'S')).toBe('G');
    expect(overallRating('', 'S')).toBe('S');
    expect(overallRating('', '')).toBe('');
  });
});

describe('merge fields', () => {
  it('fills fields, applies filters and escapes everything', () => {
    expect(mergeText('{{student.name|first}} · {{meta.reportDate|long}}', scope)).toBe('Sara · November 13, 2026');
    expect(mergeHtml('<b>{{student.name}}</b>', { student: { name: '<x>' } })).toBe('&lt;b&gt;&lt;x&gt;&lt;/b&gt;');
  });
  it('turns **bold**, *italic* and newlines into markup', () => {
    expect(mergeHtml('**Hi** *there*\nnext', {})).toBe('<strong>Hi</strong> <em>there</em><br>next');
  });
  it('drops an optional [[ part ]] when all of its fields are empty', () => {
    const s = { school: { address: '1 Main St', phone: '', website: 'x.test' } };
    expect(mergeText('{{school.address}}[[ | {{school.phone}}]][[ | {{school.website}}]]', s)).toBe('1 Main St | x.test');
    expect(mergeHtml('[[Tel: {{school.phone}}]]', s)).toBe('');
    expect(mergeText('[[no fields here]]', s)).toBe('no fields here');
  });

  it('prints unknown fields as nothing and lists the fields used', () => {
    expect(mergeText('a{{nope.x}}b', scope)).toBe('ab');
    expect(mergeFieldsIn('{{student.name}} {{ meta.term | upper }}')).toEqual(['student.name', 'meta.term']);
  });
});
