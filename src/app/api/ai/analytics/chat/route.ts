import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/analytics/chat — the app's first streaming AI route.
// Body: { context: string, messages: {role, content}[], newMessage: string }
// Returns: a chunked text/plain stream of raw answer tokens (no SSE framing —
// the OpenAI SSE stream is unwrapped server-side so the client just appends text).

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, messages, newMessage } = body

    if (!context || typeof context !== 'string' || context.length < 10) {
      return NextResponse.json({ error: 'No analytics data loaded' }, { status: 400 })
    }
    if (!newMessage || typeof newMessage !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const systemPrompt = `You are an analytics assistant for a teacher, answering questions about their school's grade data.
You have access to this analytics snapshot of what the teacher is currently viewing:

<SNAPSHOT>
${context}
</SNAPSHOT>

Answer questions clearly and precisely using numbers from the snapshot.
If a question is not answerable from the snapshot, say what is missing (e.g. "switch to the class view to see per-assessment data").
Keep responses concise — 2-5 sentences, or a short list when comparing several students/classes.
Never invent data that is not in the snapshot.`

    const history = Array.isArray(messages)
      ? messages
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-12) // keep the last 12 turns
      : []

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: newMessage },
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!openAIResponse.ok || !openAIResponse.body) {
      const errorData = await openAIResponse.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      const isQuota = openAIResponse.status === 429
      return NextResponse.json(
        { error: isQuota ? 'AI rate limit reached — try again in a moment' : 'Failed to start chat stream' },
        { status: isQuota ? 429 : 500 }
      )
    }

    // Unwrap OpenAI's SSE frames ("data: {...}\n\n") into a raw token stream.
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const upstream = openAIResponse.body

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.getReader()
        let buffer = ''
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data: ')) continue
              const payload = trimmed.slice(6)
              if (payload === '[DONE]') {
                controller.close()
                return
              }
              try {
                const parsed = JSON.parse(payload)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) controller.enqueue(encoder.encode(delta))
              } catch {
                // malformed chunk — skip
              }
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error in analytics chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
