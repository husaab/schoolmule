// src/services/types/adminApproval.d.ts

import { SchoolUser } from './adminUser';

/** Roles a public signup can be approved as. Admins are made from the Users page. */
export type SignupRole = 'TEACHER' | 'PARENT';

export interface ChildCandidate {
  studentId: string;
  name: string;
  grade: string;
}

/**
 * A signup waiting in the queue, one that was declined (isArchived + declinedAt),
 * or one that hasn't clicked the link in their verification email (!isVerified).
 */
export interface ApprovalUser extends SchoolUser {
  /** false until they verify their email; approving 409s until then. */
  isVerified: boolean;
  /** Active-year students whose family email on file matches this signup's email. */
  matchedChildren: ChildCandidate[];
}

/** A student whose family email on file matches the signup's email. */
export interface SuggestedChild extends ChildCandidate {
  relation: string;
}

export interface ChildCandidatesResponse {
  /** Every active-year student, for the search box. */
  students: ChildCandidate[];
  suggested: SuggestedChild[];
}

export interface ChildLink {
  studentId: string;
  relation: string;
}

export interface RenameSignupRequest {
  firstName: string;
  /** May be empty for a single-name user. */
  lastName: string;
}

export interface ApproveSignupRequest {
  /** Omit to keep the role they picked at signup. */
  role?: SignupRole;
  /** Send both to correct the name on the way in; omit to keep what they typed. */
  firstName?: string;
  lastName?: string;
  /** Parents only. */
  children?: ChildLink[];
  sendEmail?: boolean;
}

export interface ApproveSignupResult {
  user: ApprovalUser;
  linkedCount: number;
  emailSent: boolean;
}

export interface DeclineSignupResult {
  user: ApprovalUser;
  emailSent: boolean;
}

export interface ResendVerificationResult {
  emailSent: boolean;
}
