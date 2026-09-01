import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/dashboard-briefing
// Body: { context: string }
// Returns: { briefing: string }

const SYSTEM_PROMPT = `You are writing the morning briefing on a school administrator's dashboard.
You receive a snapshot of the school's current numbers plus a short attendance history.

Write 2-4 short sentences that tell them what is worth knowing right now:
- Lead with attendance direction if there is enough history to judge one (rising, flat, slipping), using precise numbers.
- Call out anything that needs action: attendance below 90%, report cards not started, no published timetable.
- End with one concrete thing to do today when the data supports one.

Rules:
- Never invent numbers, names, grades or trends. Use only what is in the snapshot.
- When the term has not started or the data is empty, say that plainly and point at the setup that is still outstanding, instead of inventing a trend. Do not describe zero or missing attendance as a decline.
- Address the reader as "you". Plain prose, no headings, no bullets, no greeting, no sign-off.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context } = body

    if (!context || typeof context !== 'string' || context.length < 10) {
      return NextResponse.json({ error: 'No dashboard data loaded' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `School snapshot:\n${context}\n\nWrite the briefing.` },
        ],
        max_tokens: 300,
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      const isQuota = response.status === 429
      return NextResponse.json(
        { error: isQuota ? 'AI rate limit reached — try again in a moment' : 'Failed to generate briefing' },
        { status: isQuota ? 429 : 500 }
      )
    }

    const data = await response.json()
    const briefing = data.choices?.[0]?.message?.content?.trim()
    if (!briefing) {
      return NextResponse.json({ error: 'No briefing generated' }, { status: 500 })
    }

    return NextResponse.json({ briefing })
  } catch (error) {
    console.error('Error generating dashboard briefing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
