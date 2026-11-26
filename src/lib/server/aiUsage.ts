// src/lib/server/aiUsage.ts
// Server only (route handlers under src/app/api/ai). The AI routes spend the
// school's shared OpenAI key from this server, where there is no database, so
// each one reports to the backend with the caller's own token: once before it
// calls the model (the backend refuses when the person or the school has
// reached a limit, and counts the request otherwise) and once after, with the
// tokens it used. The limits live in schoolmule-backend/services/aiUsage.js.
//
// Both calls fail open: a backend that can't be reached, or one that predates
// these endpoints, never switches an AI feature off. Only a clear "limit
// reached" answer stops a request.

import { NextResponse } from 'next/server'
import type { AiSession } from '@/lib/server/aiSession'

const BACKEND_URL = process.env.NEXT_PUBLIC_BASE_URL

/** The names the backend counts under (services/aiUsage.js FEATURES). */
export type AiFeature =
  | 'generate_comment'
  | 'generate_jksk_comment'
  | 'generate_progress_comment'
  | 'dashboard_briefing'
  | 'analytics_chat'
  | 'analytics_insights'
  | 'analytics_report'
  | 'analytics_at_risk'

/** `usage` as a Chat Completions answer reports it. */
export type OpenAiUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number }
}

const post = (path: string, token: string, body: unknown) =>
  fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

/**
 * Call before spending the key. Null when the request may go ahead; otherwise
 * the 429 response to send back, carrying the backend's message.
 */
export async function startAiRequest(session: AiSession, feature: AiFeature): Promise<NextResponse | null> {
  if (!BACKEND_URL || !session.token) return null
  try {
    const res = await post('/ai-usage/start', session.token, { feature })
    if (res.status !== 429) return null
    const data = await res.json().catch(() => null)
    // The backend's general rate limiter also answers 429; only its AI limits stop a request.
    if (typeof data?.code !== 'string' || !data.code.startsWith('AI_LIMIT_')) return null
    return NextResponse.json(
      { error: typeof data.message === 'string' ? data.message : 'AI limit reached', code: data.code },
      { status: 429 },
    )
  } catch (err) {
    console.error('AI usage: the limit could not be checked', err)
    return null
  }
}

/** Call after the model answered, with the answer's `usage`. Never throws. */
export async function recordAiUsage(session: AiSession, feature: AiFeature, usage: OpenAiUsage | null | undefined): Promise<void> {
  if (!BACKEND_URL || !session.token || !usage) return
  try {
    await post('/ai-usage/record', session.token, {
      feature,
      inputTokens: usage.prompt_tokens ?? 0,
      cachedInputTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    })
  } catch (err) {
    console.error('AI usage: the tokens could not be recorded', err)
  }
}
