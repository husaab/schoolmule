import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/analytics/at-risk-explain
// Body: one student's risk profile (computed deterministically client-side).
// Returns: { explanation: string }

const SYSTEM_PROMPT = `You are a caring school counselor helping a teacher understand why a student may be struggling and what to do about it.
Given a student's risk profile, write 2-3 sentences that:
- Acknowledge the specific factors present (grade level, attendance, missing work, declining trajectory)
- Suggest 1-2 concrete intervention actions the teacher can take this week
- Use a supportive, constructive tone — the goal is to help, not alarm
Do not use the words "at-risk" or "flagged". Refer to the student by first name. Output plain prose.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentName,
      gradePercent,
      attendancePercent,
      missingWorkCount,
      trajectoryDelta,
      riskScore,
      riskFlags,
      classContext,
    } = body

    if (!studentName) {
      return NextResponse.json({ error: 'Missing studentName' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const profile = [
      `Student: ${studentName}`,
      `Overall grade: ${gradePercent != null ? `${gradePercent}%` : 'no graded work yet'}`,
      `Attendance: ${attendancePercent != null ? `${attendancePercent}%` : 'no records'}`,
      `Missing assignments: ${missingWorkCount ?? 0}`,
      trajectoryDelta ? `Change vs previous term: ${trajectoryDelta > 0 ? '+' : ''}${trajectoryDelta} points` : null,
      `Computed risk score: ${riskScore ?? '—'}/100`,
      riskFlags?.length ? `Factors: ${riskFlags.join(', ')}` : null,
      classContext ? `Context: ${classContext}` : null,
    ]
      .filter(Boolean)
      .join('\n')

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
          { role: 'user', content: `${profile}\n\nWrite the explanation and suggested next steps.` },
        ],
        max_tokens: 250,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      const isQuota = response.status === 429
      return NextResponse.json(
        { error: isQuota ? 'AI rate limit reached — try again in a moment' : 'Failed to generate explanation' },
        { status: isQuota ? 429 : 500 }
      )
    }

    const data = await response.json()
    const explanation = data.choices?.[0]?.message?.content?.trim()
    if (!explanation) {
      return NextResponse.json({ error: 'No explanation generated' }, { status: 500 })
    }

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('Error generating at-risk explanation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
