import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/analytics/report-composer
// Body: { context, sections: string[], audience, schoolName, termName }
// Returns: { report: string } — markdown with ## section headers.

const ALL_SECTIONS = ['Overview', 'Highlights', 'Areas of Concern', 'Recommendations'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, sections, audience, schoolName, termName, scope } = body

    if (!context || typeof context !== 'string' || context.length < 10) {
      return NextResponse.json({ error: 'No analytics data loaded' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const wanted: string[] =
      Array.isArray(sections) && sections.length > 0
        ? ALL_SECTIONS.filter((s) => sections.includes(s))
        : [...ALL_SECTIONS]

    const audienceLabel =
      audience === 'parent-night' ? 'a parent information night' : 'the school principal'

    const systemPrompt = `You are writing a formal academic performance summary for ${audienceLabel}.
Based on the analytics snapshot provided, write a structured report containing EXACTLY these markdown sections, in order:
${wanted.map((s) => `## ${s}`).join('\n')}

Section guidance:
- Overview: 2-3 sentences summarizing the period and overall performance.
- Highlights: 3-5 bullet points (use "- ") of the strongest results — specific grades, subjects, classes or improvements.
- Areas of Concern: 3-5 bullet points of performance gaps, anomalous assessments, or attendance issues. Factual and constructive; pay attention to [FLAG:...] markers.
- Recommendations: 3-5 actionable bullet points for next steps.

Use precise numbers from the snapshot. Formal but accessible language for ${audienceLabel}.
${audience === 'parent-night' ? 'Do NOT name individual students — aggregate statements only.' : 'Naming individual students is acceptable where it adds clarity.'}
${scope && scope !== 'Whole School' ? `This report is scoped to: ${scope}. Write only about that scope.` : ''}
Start the document with "# ${schoolName || 'School'} — ${scope && scope !== 'Whole School' ? `${scope} — ` : ''}${termName || 'Term'} Performance Summary".
Output markdown only.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analytics snapshot:\n${context}\n\nWrite the report.` },
        ],
        max_tokens: 1200,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      const isQuota = response.status === 429
      return NextResponse.json(
        { error: isQuota ? 'AI rate limit reached — try again in a moment' : 'Failed to generate report' },
        { status: isQuota ? 429 : 500 }
      )
    }

    const data = await response.json()
    const report = data.choices?.[0]?.message?.content?.trim()
    if (!report) {
      return NextResponse.json({ error: 'No report generated' }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
