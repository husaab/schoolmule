import type { SignupRole } from '@/services/types/adminApproval'

// Words for each signup page. The chooser and the two role pages share one
// layout (SignupShell); only the copy changes, so it lives here in one place.

export type SignupVariant = 'directory' | 'chooser' | 'parent' | 'teacher'

export interface SignupCopy {
  /** Small uppercase label above the school name (pages that show a school). */
  eyebrow?: string
  /** Big heading on the branding panel; `accent` is the highlighted last word(s). */
  heading: string
  accent: string
  blurb: string
  benefits: string[]
}

export const SIGNUP_COPY: Record<SignupVariant, SignupCopy> = {
  directory: {
    heading: 'Find',
    accent: 'your school',
    blurb: 'Pick your school to create a parent or staff account. Every account is approved by the school.',
    benefits: [
      'Parents follow their children\u2019s progress',
      'Teachers manage classes, grades and attendance',
      'Report cards and progress reports in one place',
      'Your school admin approves every account',
    ],
  },
  chooser: {
    eyebrow: 'Create your account',
    heading: 'Stay close to',
    accent: 'your school',
    blurb: 'One account for grades, attendance, report cards and messages from the school.',
    benefits: [
      'Parents follow their children’s progress',
      'Teachers manage classes, grades and attendance',
      'Report cards and progress reports in one place',
      'Your school admin approves every account',
    ],
  },
  parent: {
    eyebrow: 'Parent account',
    heading: 'Follow your child’s',
    accent: 'progress',
    blurb: 'See grades, attendance and report cards as soon as the school publishes them.',
    benefits: [
      'Grades and feedback as they are published',
      'Daily attendance for each of your children',
      'Report cards and progress reports to download',
      'Switch between children in one account',
    ],
  },
  teacher: {
    eyebrow: 'Teacher & staff account',
    heading: 'Everything you need to',
    accent: 'run your classes',
    blurb: 'Gradebook, attendance, report cards and your timetable in one place.',
    benefits: [
      'Gradebook with weighted assessments',
      'Class and homeroom attendance',
      'Report card and progress report comments',
      'Your schedule and school calendar',
    ],
  },
}


/** Per-role wiring for the two signup forms: which copy, and how to switch roles. */
export const SIGNUP_ROLE_PAGES: Record<
  SignupRole,
  { variant: SignupVariant; backLabel: string; altPrompt: string; altLabel: string; altSegment: string }
> = {
  PARENT: {
    variant: 'parent',
    backLabel: 'Not a parent?',
    altPrompt: 'School staff?',
    altLabel: 'Sign up as a teacher instead',
    altSegment: 'teacher',
  },
  TEACHER: {
    variant: 'teacher',
    backLabel: 'Not staff?',
    altPrompt: 'Here for your child?',
    altLabel: 'Sign up as a parent instead',
    altSegment: 'parent',
  },
}
