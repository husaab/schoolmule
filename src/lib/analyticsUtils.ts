// src/lib/analyticsUtils.ts
//
// Pure utilities for the analytics page: the AI context serializer,
// the deterministic at-risk score, and a minimal markdown renderer
// for the report composer's print view. No React imports.

import {
  OverviewData,
  ClassData,
  StudentData,
  SnapshotStudent,
  AnalyticsViewLevel,
  AtRiskResult,
} from '@/services/types/analytics'

// ────────────────────────────────────────────────────────────────────
// AI context serialization
// ────────────────────────────────────────────────────────────────────
//
// Turns the currently-loaded analytics state into a terse labeled-text
// block (≤ ~2.5k tokens) that the AI routes embed in their prompts.
// Inline [FLAG:...] markers point the model at anomalies so it doesn't
// have to re-derive them.

export interface AnalyticsContextInput {
  viewLevel: AnalyticsViewLevel
  termName: string
  compareTermName?: string | null
  engine: string
  selectedGrade?: string | null
  selectedSubject?: string | null
  overview?: OverviewData | null
  classDetail?: ClassData | null
  studentDetail?: StudentData | null
  atRiskStudents?: Array<SnapshotStudent & { risk: AtRiskResult }>
}

const fmt = (v: number | null | undefined, suffix = '%'): string =>
  v == null ? '—' : `${v}${suffix}`

function statsLine(stats: { avg: number; median: number; q1: number; q3: number; min: number; max: number } | null): string {
  if (!stats) return 'no graded data'
  return `avg=${stats.avg}% median=${stats.median}% q1=${stats.q1}% q3=${stats.q3}% low=${stats.min}% high=${stats.max}%`
}

export function serializeAnalyticsContext(input: AnalyticsContextInput): string {
  const lines: string[] = []
  lines.push(
    `TERM: ${input.termName}${input.compareTermName ? ` (compared vs ${input.compareTermName})` : ''} | VIEW: ${input.viewLevel} | ENGINE: ${
      input.engine === 'null_zero' ? 'ungraded counts as zero' : 'ungraded work skipped'
    }`
  )

  const ov = input.overview
  if (ov && (input.viewLevel === 'school' || input.viewLevel === 'grade')) {
    lines.push(
      `SCHOOL: ${ov.school.totalStudents} students, ${ov.school.totalClasses} classes | ${statsLine(ov.school.stats)}`
    )

    const grades = input.viewLevel === 'grade' && input.selectedGrade
      ? ov.byGrade.filter((g) => g.grade === input.selectedGrade)
      : ov.byGrade

    lines.push('GRADES:')
    for (const g of grades) {
      const flag = g.stats && g.stats.avg < 65 ? ' [FLAG: grade avg<65]' : ''
      lines.push(`  Grade ${g.grade} | ${g.studentCount} students | ${statsLine(g.stats)}${flag}`)
    }

    lines.push('SUBJECTS:')
    for (const s of ov.bySubject) {
      const flag = s.stats && s.stats.avg < 65 ? ' [FLAG: subject avg<65]' : ''
      lines.push(`  ${s.subject} | ${s.classCount} classes | ${statsLine(s.stats)}${flag}`)
    }

    if (ov.termDiff) {
      lines.push('TERM CHANGE (current vs compare):')
      for (const d of ov.termDiff.byGrade) {
        if (d.avgDiff == null) continue
        const flag = d.avgDiff <= -5 ? ' [FLAG: dropped>=5]' : ''
        lines.push(`  Grade ${d.grade}: ${d.previousAvg}% -> ${d.currentAvg}% (${d.avgDiff! > 0 ? '+' : ''}${d.avgDiff})${flag}`)
      }
    }

    // Per-student rows only at grade level (school level stays aggregate).
    if (input.viewLevel === 'grade' && grades.length === 1) {
      lines.push('STUDENTS (name | overall% | missing):')
      for (const stu of grades[0].students) {
        const flags: string[] = []
        if (stu.overallAvg != null && stu.overallAvg < 60) flags.push('grade<60')
        if (stu.missingCount >= 3) flags.push(`missing=${stu.missingCount}`)
        lines.push(
          `  ${stu.studentName} | ${fmt(stu.overallAvg)} | ${stu.missingCount}${flags.length ? ` [FLAG: ${flags.join(',')}]` : ''}`
        )
      }
    }
  }

  // Subject view: one subject, either school-wide or scoped to a grade.
  if (ov && input.viewLevel === 'subject' && input.selectedSubject) {
    const subj = ov.bySubject.find((s) => s.subject === input.selectedSubject)
    if (subj) {
      const gradeScoped = input.selectedGrade != null
      const classes = gradeScoped
        ? subj.classes.filter((c) => c.grade === input.selectedGrade)
        : subj.classes
      if (gradeScoped) {
        lines.push(`SUBJECT: ${subj.subject} in Grade ${input.selectedGrade} | ${classes.length} class(es)`)
      } else {
        lines.push(`SUBJECT: ${subj.subject} (school-wide) | ${subj.classCount} classes | ${statsLine(subj.stats)}`)
      }
      lines.push('CLASSES (grade | teacher | class avg | median):')
      for (const c of classes) {
        const flag = c.classAvg != null && c.classAvg < 65 ? ' [FLAG: class avg<65]' : ''
        lines.push(
          `  Grade ${c.grade} | ${c.teacherName} | ${fmt(c.classAvg)} | ${fmt(c.classMedian)}${flag}`
        )
      }
    }
  }

  const cd = input.classDetail
  if (cd && input.viewLevel === 'class') {
    lines.push(`CLASS: Grade ${cd.grade} ${cd.subject} | Teacher: ${cd.teacherName} | ${cd.students.length} students`)
    lines.push(`CLASS STATS: ${statsLine(cd.summary.stats)}`)
    lines.push('ASSESSMENTS (name | avg | median | completion):')
    for (const a of cd.assessments) {
      const flag = a.isAnomalous ? ' [FLAG: anomalous — too hard or very high spread]' : ''
      lines.push(
        `  ${a.name} | ${fmt(a.stats?.avg)} | ${fmt(a.stats?.median)} | ${Math.round(a.completionRate * 100)}% done${flag}`
      )
    }
    lines.push('STUDENTS (name | grade% | rank | missing):')
    for (const s of cd.students) {
      const flags: string[] = []
      if (s.finalPct != null && s.finalPct < 60) flags.push('grade<60')
      if (s.missingCount >= 3) flags.push(`missing=${s.missingCount}`)
      lines.push(
        `  ${s.studentName} | ${fmt(s.finalPct)} | #${s.rank ?? '—'} | ${s.missingCount}${flags.length ? ` [FLAG: ${flags.join(',')}]` : ''}`
      )
    }
  }

  const sd = input.studentDetail
  if (sd && input.viewLevel === 'student') {
    lines.push(`STUDENT: ${sd.studentName} | Grade ${sd.gradeLevel}`)
    lines.push(
      `OVERALL: avg=${fmt(sd.overall.avg)} | percentile-in-grade=${fmt(sd.overall.percentileInGrade, '')} | attendance=${fmt(sd.attendance?.pct)} | missing=${sd.overall.missingCount}`
    )
    if (sd.termTrajectory) {
      const t = sd.termTrajectory
      const flag = t.diff != null && t.diff <= -5 ? ' [FLAG: declining]' : ''
      lines.push(`TRAJECTORY: ${fmt(t.compareAvg)} -> ${fmt(t.currentAvg)} (${t.diff != null && t.diff > 0 ? '+' : ''}${t.diff ?? '—'})${flag}`)
    }
    lines.push('CLASSES (subject | student% | class avg | percentile | missing):')
    for (const c of sd.classes) {
      const flags: string[] = []
      if (c.finalPct != null && c.finalPct < 60) flags.push('grade<60')
      if (c.finalPct != null && c.classAvg != null && c.finalPct < c.classAvg - 15) flags.push('far below class avg')
      lines.push(
        `  ${c.subject} | ${fmt(c.finalPct)} | ${fmt(c.classAvg)} | ${fmt(c.percentileInClass, '')} | ${c.missingCount}${flags.length ? ` [FLAG: ${flags.join(',')}]` : ''}`
      )
    }
    if (sd.missingWork.length > 0) {
      lines.push('MISSING WORK:')
      for (const m of sd.missingWork.slice(0, 15)) {
        lines.push(`  ${m.subject}: ${m.assessmentName}${m.weightPoints ? ` (worth ${m.weightPoints} pts)` : ''}`)
      }
    }
  }

  if (input.atRiskStudents && input.atRiskStudents.length > 0) {
    lines.push('AT-RISK WATCHLIST (name | risk score | factors):')
    for (const s of input.atRiskStudents.slice(0, 20)) {
      lines.push(`  ${s.studentName} | ${s.risk.score}/100 ${s.risk.tier} | ${s.risk.flags.join(', ') || 'none'}`)
    }
  }

  return lines.join('\n')
}

// ────────────────────────────────────────────────────────────────────
// Deterministic at-risk scoring
// ────────────────────────────────────────────────────────────────────

export interface AtRiskInput {
  /** Overall weighted grade 0-100, or null when nothing is graded yet. */
  gradePercent: number | null
  /** Attendance 0-100, or null when no attendance is recorded. */
  attendancePercent: number | null
  /** Count of top-level assessments with no grade (not excluded). */
  missingWorkCount: number
  /** Grade-points change vs the compared term (negative = declining); 0 when no comparison. */
  trajectoryDelta: number
}

// Score one student's risk across four dimensions, 0–25 points each
// (total 0–100). Flags are shown as UI badges and fed to the AI explainer.
//
// Null policy: a null gradePercent or attendancePercent means "no data
// yet" and contributes 0 points (no-data ≠ at-risk). New students with
// nothing graded should not light up the watchlist; once any work is
// graded or attendance is taken, real signals take over.
export function computeAtRiskScore(input: AtRiskInput): AtRiskResult {
  const flags: string[] = []
  let score = 0

  // Grade band (0–25)
  const g = input.gradePercent
  if (g != null) {
    if (g < 50) { score += 25; flags.push('grade<50') }
    else if (g < 60) { score += 20; flags.push('grade<60') }
    else if (g < 70) { score += 14; flags.push('grade<70') }
    else if (g < 75) { score += 7 }
  }

  // Attendance band (0–25)
  const a = input.attendancePercent
  if (a != null) {
    if (a < 70) { score += 25; flags.push('attendance<70') }
    else if (a < 75) { score += 20; flags.push('attendance<75') }
    else if (a < 80) { score += 14; flags.push('attendance<80') }
    else if (a < 85) { score += 7 }
  }

  // Missing work (0–25)
  const m = input.missingWorkCount
  if (m >= 5) { score += 25; flags.push('missing>=5') }
  else if (m >= 3) { score += 18; flags.push('missing>=3') }
  else if (m >= 2) { score += 10; flags.push('missing>=2') }
  else if (m >= 1) { score += 5 }

  // Trajectory vs compared term (0–25); 0 when no comparison selected
  const t = input.trajectoryDelta
  if (t <= -15) { score += 25; flags.push('declining severely') }
  else if (t <= -8) { score += 15; flags.push('declining') }
  else if (t <= -3) { score += 7 }

  const tier: AtRiskResult['tier'] = score >= 60 ? 'high' : score >= 30 ? 'moderate' : 'low'
  return { score, flags, tier }
}

// ────────────────────────────────────────────────────────────────────
// Minimal markdown -> HTML for the report composer print target.
// Handles exactly what the AI report produces: ## headers, - bullets,
// **bold**, and paragraphs. Content is escaped first.
// ────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function markdownToHtml(md: string): string {
  const out: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const raw of md.split('\n')) {
    const line = raw.trimEnd()
    const bolded = escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    if (/^##\s+/.test(line)) {
      closeList()
      out.push(`<h2>${bolded.replace(/^##\s+/, '')}</h2>`)
    } else if (/^#\s+/.test(line)) {
      closeList()
      out.push(`<h1>${bolded.replace(/^#\s+/, '')}</h1>`)
    } else if (/^-\s+/.test(line)) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${bolded.replace(/^-\s+/, '')}</li>`)
    } else if (line.trim() === '') {
      closeList()
    } else {
      closeList()
      out.push(`<p>${bolded}</p>`)
    }
  }
  closeList()
  return out.join('\n')
}
