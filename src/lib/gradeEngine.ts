// src/lib/gradeEngine.ts
//
// Line-for-line TypeScript port of schoolmule-backend/services/gradeEngine.js.
// The backend file is canonical; this copy exists only so the gradebook grid
// can preview totals while the teacher types, before saving. Change both
// files together.
//
// Rule: a student's grade is the weighted average of the assessments that
// have EVIDENCE (a score, 0 included, or a deliberate "missing" flag which
// counts as 0), scaled to the weight of those assessments only. A blank
// cell is "not yet graded" and carries no weight. An excused cell never
// counts. No evidence at all -> null, never 0.

export type CellState = 'blank' | 'graded' | 'missing' | 'excused';
export type ScoreStatus = 'graded' | 'missing' | 'excused';

export interface EngineAssessment {
  assessment_id: string;
  weight_points?: number | string | null;
  weight_percent?: number | string | null;
  max_score?: number | string | null;
  is_parent?: boolean | null;
  parent_assessment_id?: string | null;
  name?: string;
}

export interface EngineScoreRow {
  assessment_id: string;
  score: number | string | null | undefined;
  status?: ScoreStatus | null;
  is_excluded?: boolean | null;
}

export interface ScoreLookupEntry {
  score: number | null;
  state: CellState;
}
export type ScoreLookup = Record<string, ScoreLookupEntry>;

export interface AssessmentResult {
  state: CellState;
  isCounted: boolean;
  pct: number | null;
  earned: number | null;
  max: number | null;
  weight: number;
}

export interface Coverage {
  assessed: number;
  graded: number;
  missing: number;
  excused: number;
  blank: number;
  total: number;
  countedWeight: number;
  totalWeight: number;
}

export interface ClassGrade {
  pct: number | null;
  coverage: Coverage;
  missingAssessments: EngineAssessment[];
}

function toNum(v: unknown, fallback: number): number {
  const n = parseFloat(v as string);
  return Number.isFinite(n) ? n : fallback;
}

/** Resolve a score row to a cell state. Accepts legacy is_excluded. */
export function cellState(row?: EngineScoreRow | null): CellState {
  if (!row) return 'blank';
  const status: ScoreStatus = row.status || (row.is_excluded ? 'excused' : 'graded');
  if (status === 'excused') return 'excused';
  if (status === 'missing') return 'missing';
  return row.score == null || row.score === '' ? 'blank' : 'graded';
}

export function buildScoreLookup(rows: EngineScoreRow[] | null | undefined): ScoreLookup {
  const lookup: ScoreLookup = {};
  for (const row of rows || []) {
    lookup[row.assessment_id] = {
      score: row.score == null || row.score === '' ? null : parseFloat(String(row.score)),
      state: cellState(row),
    };
  }
  return lookup;
}

export function computeAssessmentForStudent(
  assessment: EngineAssessment,
  allAssessments: EngineAssessment[],
  scoreLookup: ScoreLookup,
): AssessmentResult {
  const weight = toNum(assessment.weight_points, 0);
  const notCounted = (state: CellState): AssessmentResult => ({
    state, isCounted: false, pct: null, earned: null, max: null, weight,
  });

  if (assessment.is_parent) {
    const children = allAssessments.filter((c) => c.parent_assessment_id === assessment.assessment_id);
    let earned = 0;
    let countedWeight = 0;
    let excusedChildren = 0;
    for (const c of children) {
      const sd = scoreLookup[c.assessment_id];
      const state = sd ? sd.state : 'blank';
      if (state === 'excused') { excusedChildren += 1; continue; }
      if (state === 'blank') continue;
      const max = toNum(c.max_score, 0) || 100;
      const cw = toNum(c.weight_points, 0);
      const pct = state === 'missing' ? 0 : Math.min((sd.score as number) / max, 1);
      earned += pct * cw;
      countedWeight += cw;
    }
    if (countedWeight === 0) {
      return notCounted(children.length > 0 && excusedChildren === children.length ? 'excused' : 'blank');
    }
    return { state: 'graded', isCounted: true, pct: (earned / countedWeight) * 100, earned: null, max: null, weight };
  }

  const sd = scoreLookup[assessment.assessment_id];
  const state = sd ? sd.state : 'blank';
  if (state === 'blank' || state === 'excused') return notCounted(state);
  const max = toNum(assessment.max_score, 0) || 100;
  if (state === 'missing') {
    return { state, isCounted: true, pct: 0, earned: 0, max, weight };
  }
  return { state, isCounted: true, pct: ((sd.score as number) / max) * 100, earned: sd.score, max, weight };
}

export function computeClassGrade(assessments: EngineAssessment[], rows: EngineScoreRow[]): ClassGrade {
  const lookup = buildScoreLookup(rows);
  const topLevel = assessments.filter((a) => !a.parent_assessment_id);

  let earned = 0;
  let countedWeight = 0;
  let totalWeight = 0;
  for (const a of topLevel) {
    const r = computeAssessmentForStudent(a, assessments, lookup);
    totalWeight += r.weight;
    if (!r.isCounted) continue;
    earned += ((r.pct as number) * r.weight) / 100;
    countedWeight += r.weight;
  }

  const coverage: Coverage = {
    assessed: 0, graded: 0, missing: 0, excused: 0, blank: 0, total: 0, countedWeight, totalWeight,
  };
  const missingAssessments: EngineAssessment[] = [];
  for (const a of assessments) {
    if (a.is_parent) continue;
    const sd = lookup[a.assessment_id];
    const state = sd ? sd.state : 'blank';
    coverage.total += 1;
    coverage[state] += 1;
    if (state === 'missing') missingAssessments.push(a);
  }
  coverage.assessed = coverage.graded + coverage.missing;

  return {
    pct: countedWeight > 0 ? (earned / countedWeight) * 100 : null,
    coverage,
    missingAssessments,
  };
}

/** "2 of 5 assessed · 1 missing · 1 excused" */
export function formatCoverage(coverage?: Pick<Coverage, 'assessed' | 'total' | 'missing' | 'excused'> | null): string {
  if (!coverage) return '';
  const parts = [`${coverage.assessed} of ${coverage.total} assessed`];
  if (coverage.missing) parts.push(`${coverage.missing} missing`);
  if (coverage.excused) parts.push(`${coverage.excused} excused`);
  return parts.join(' · ');
}
