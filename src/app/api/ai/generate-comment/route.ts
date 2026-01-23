import { NextRequest, NextResponse } from 'next/server'

// Rating labels for context
const RATING_LABELS: Record<string, string> = {
  E: 'Excellent',
  G: 'Good',
  S: 'Satisfactory',
  N: 'Needs Improvement',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentName, subject, workHabits, behavior, term } = body

    if (!studentName || !workHabits || !behavior) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const workHabitsLabel = RATING_LABELS[workHabits] || workHabits
    const behaviorLabel = RATING_LABELS[behavior] || behavior

    const prompt = `You are a helpful assistant writing report card comments for teachers. Generate a professional, warm, and constructive report card comment for a student.

Student Information:
- Name: ${studentName}
- Subject: ${subject}
- Term: ${term || 'Current Term'}
- Work Habits Rating: ${workHabitsLabel}
- Behavior Rating: ${behaviorLabel}

Guidelines:
- Write in third person, referring to the student by their first name only (e.g., "John" not "John Smith")
- Keep the comment between 2-4 sentences
- Be specific and encouraging while honest about areas for improvement
- If ratings are Excellent or Good, focus on strengths and positive contributions
- If ratings are Satisfactory, acknowledge effort and suggest ways to improve
- If ratings are Needs Improvement, be constructive and focus on growth opportunities
- Do not include the letter grades (E, G, S, N) in the comment
- Write in a professional but warm tone suitable for parents to read
- End on a positive or forward-looking note

Generate only the comment text, no additional formatting or labels.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced teacher writing helpful, constructive report card comments.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate comment' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const comment = data.choices?.[0]?.message?.content?.trim()

    if (!comment) {
      return NextResponse.json(
        { error: 'No comment generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error generating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
