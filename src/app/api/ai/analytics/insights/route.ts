import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/analytics/insights
// Body: { context: string, viewLevel: 'school'|'grade'|'class'|'student' }
// Returns: { insight: string }

const SYSTEM_PROMPT = `You are an expert school data analyst helping a teacher understand performance trends.
You receive a structured analytics snapshot of a school, grade cohort, class, or individual student.
Write a concise professional narrative (3-6 sentences) that:
- Identifies the most important pattern or trend in the data
- Calls out anomalies marked with [FLAG:...] (e.g. an unusually low assessment median suggests it was too difficult)
- Names notable students only when they represent a meaningful pattern (top performer, sharp decline, significant risk)
- Uses precise numbers from the data
- Is written for a teacher, not a parent — direct and analytical
Do not fabricate data. If the snapshot has insufficient data, say so briefly. Output plain prose, no headers or bullets.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, viewLevel } = body

    if (!context || typeof context !== 'string' || context.length < 10) {
      return NextResponse.json({ error: 'No analytics data loaded' }, { status: 400 })
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
          {
            role: 'user',
            content: `Current view: ${viewLevel || 'school'}\n\nAnalytics snapshot:\n${context}\n\nWrite the insight narrative.`,
          },
        ],
        max_tokens: 600,
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      const isQuota = response.status === 429
      return NextResponse.json(
        { error: isQuota ? 'AI rate limit reached — try again in a moment' : 'Failed to generate insights' },
        { status: isQuota ? 429 : 500 }
      )
    }

    const data = await response.json()
    const insight = data.choices?.[0]?.message?.content?.trim()
    if (!insight) {
      return NextResponse.json({ error: 'No insight generated' }, { status: 500 })
    }

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
