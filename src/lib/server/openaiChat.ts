// src/lib/server/openaiChat.ts
// Server only (route handlers under src/app/api/ai). The one place those
// routes name a model and build a Chat Completions request, so a model
// change is one line here (or the OPENAI_MODEL variable) and not nine files.
//
// OpenAI retires gpt-4o-mini on 14 January 2027 and names gpt-6-luna as its
// replacement. The newer models think before answering by default, and that
// thinking is billed against the same output limit as the answer: with the
// short limits these features use, the answer could come back empty. These
// are one-shot writing tasks, so thinking is switched off.
//
// Which of the older request settings a model accepts changes between model
// generations (`max_tokens` became `max_completion_tokens`; some models take
// `temperature` only at its default). A setting the API refuses by name is
// swapped or dropped and the request sent again, so a rename upstream costs
// a retry and not the feature.

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna'

export type ChatMessage = { role: string; content: string }

export type ChatOptions = {
  messages: ChatMessage[]
  /** The most the answer may run to, in tokens. */
  maxTokens: number
  temperature?: number
  stream?: boolean
  model?: string
}

type Body = Record<string, unknown>

/** The gpt-4 family: no thinking, and the older name for the output limit. */
const isLegacyModel = (model: string) => model.startsWith('gpt-4')

/** The request body for these options, in the shape the model expects. */
export function chatBody({ messages, maxTokens, temperature, stream, model = AI_MODEL }: ChatOptions): Body {
  const body: Body = { model, messages }
  if (isLegacyModel(model)) {
    body.max_tokens = maxTokens
  } else {
    body.max_completion_tokens = maxTokens
    body.reasoning_effort = 'none'
  }
  if (temperature !== undefined) body.temperature = temperature
  if (stream) body.stream = true
  return body
}

const without = (body: Body, key: string): Body => {
  const rest = { ...body }
  delete rest[key]
  return rest
}

/** The same request without the setting the API refused, or null when there is nothing to change. */
export function withoutRefused(body: Body, refused: string | null): Body | null {
  if (!refused || !(refused in body)) return null
  if (refused === 'max_tokens') return { ...without(body, 'max_tokens'), max_completion_tokens: body.max_tokens }
  if (refused === 'max_completion_tokens') return { ...without(body, 'max_completion_tokens'), max_tokens: body.max_completion_tokens }
  if (refused === 'temperature' || refused === 'reasoning_effort') return without(body, refused)
  return null
}

/** The setting a 400 answer names (`error.param`), if it names one. */
async function refusedSetting(response: Response): Promise<string | null> {
  try {
    const data = await response.clone().json()
    return typeof data?.error?.param === 'string' ? data.error.param : null
  } catch {
    return null
  }
}

/**
 * POST the chat request and return OpenAI's response as is (callers read
 * `.ok`, `.json()` or the stream exactly as they did with fetch).
 */
export async function openaiChat(apiKey: string, options: ChatOptions): Promise<Response> {
  let body = chatBody(options)
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })
    if (response.status !== 400 || attempt >= 2) return response
    const refused = await refusedSetting(response)
    const adjusted = withoutRefused(body, refused)
    if (!adjusted) return response
    console.warn(`OpenAI refused "${refused}" for ${String(body.model)}; sending the request again without it`)
    body = adjusted
  }
}
