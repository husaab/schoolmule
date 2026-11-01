import type { Condition, ReportData } from './types';
import { getPath } from './util';

/** Values a condition can read beyond ReportData (e.g. the page). */
export type ConditionScope = ReportData | Record<string, unknown>;

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Compare as numbers when both sides are numeric, else as trimmed, case-insensitive text. */
function same(a: unknown, b: unknown): boolean {
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na !== null && nb !== null) return na === nb;
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

/** Field values that are lists count their length (e.g. "skills" → 7). */
function readField(scope: ConditionScope, field: string): unknown {
  const value = getPath(scope, field);
  return value;
}

/**
 * True when the condition holds. A missing or malformed condition is true
 * (show the thing), so a bad rule can hide nothing by accident.
 */
export function evaluateCondition(condition: Condition | null | undefined, scope: ConditionScope): boolean {
  if (!condition || typeof condition !== 'object') return true;

  if ('conditions' in condition && (condition.op === 'and' || condition.op === 'or')) {
    const list = Array.isArray(condition.conditions) ? condition.conditions : [];
    if (list.length === 0) return true;
    return condition.op === 'and'
      ? list.every((c) => evaluateCondition(c, scope))
      : list.some((c) => evaluateCondition(c, scope));
  }

  if (condition.op === 'not' && 'condition' in condition) {
    return !evaluateCondition(condition.condition, scope);
  }

  if (!('field' in condition) || typeof condition.field !== 'string') return true;
  const actual = readField(scope, condition.field);
  const expected = condition.value;

  switch (condition.op) {
    case 'empty':
      return isEmptyValue(actual);
    case 'notEmpty':
      return !isEmptyValue(actual);
    case 'eq':
      return same(actual, expected);
    case 'neq':
      return !same(actual, expected);
    case 'in':
    case 'notIn': {
      const list = Array.isArray(expected) ? expected : expected === undefined ? [] : [expected];
      const hit = list.some((v) => same(actual, v));
      return condition.op === 'in' ? hit : !hit;
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const a = toNumber(Array.isArray(actual) ? actual.length : actual);
      const b = toNumber(expected);
      if (a === null || b === null) return false;
      if (condition.op === 'gt') return a > b;
      if (condition.op === 'gte') return a >= b;
      if (condition.op === 'lt') return a < b;
      return a <= b;
    }
    default:
      return true;
  }
}

/** A short sentence describing a condition, for the outline and inspector. */
export function describeCondition(condition: Condition | null | undefined, labelFor: (field: string) => string = (f) => f): string {
  if (!condition) return 'Always shown';
  if ('conditions' in condition && (condition.op === 'and' || condition.op === 'or')) {
    const parts = condition.conditions.map((c) => describeCondition(c, labelFor));
    return parts.join(condition.op === 'and' ? ' and ' : ' or ');
  }
  if (condition.op === 'not' && 'condition' in condition) return `not (${describeCondition(condition.condition, labelFor)})`;
  if (!('field' in condition)) return 'Always shown';
  const label = labelFor(condition.field);
  const value = Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value ?? '');
  const words: Record<string, string> = {
    eq: `is ${value}`,
    neq: `is not ${value}`,
    in: `is one of ${value}`,
    notIn: `is not one of ${value}`,
    gt: `is more than ${value}`,
    gte: `is at least ${value}`,
    lt: `is less than ${value}`,
    lte: `is at most ${value}`,
    empty: 'is empty',
    notEmpty: 'is filled in',
  };
  return `${label} ${words[condition.op] ?? condition.op}`;
}
