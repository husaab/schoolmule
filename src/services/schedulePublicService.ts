// File: src/services/schedulePublicService.ts
// Public (unauthenticated) published-schedule access for the share-link page.

import type { ApiResponse, PublicSchedule } from './types/schedulePlanner';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export const getPublicSchedule = async (
  schoolSlug: string,
  shareToken: string
): Promise<ApiResponse<PublicSchedule>> => {
  const res = await fetch(
    `${baseURL}/schedule/public/${encodeURIComponent(schoolSlug)}/${encodeURIComponent(shareToken)}`
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Schedule not found');
  }
  return res.json() as Promise<ApiResponse<PublicSchedule>>;
};
