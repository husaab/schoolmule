import { NextRequest, NextResponse } from 'next/server'

// Rating labels for context
const RATING_LABELS: Record<string, string> = {
  E: 'Excellent',
  G: 'Good',
  S: 'Satisfactory',
  N: 'Needs Improvement',
}

// Core Standards tone guidance
const CORE_STANDARDS_TONE: Record<string, string> = {
  'Exceeding Common Core Standards':
    'The student is exceeding grade-level expectations. Use a very positive, celebratory tone. Highlight their impressive progress and encourage continued excellence.',
  'Meeting Common Core Standards':
    'The student is meeting grade-level expectations. Use a positive, encouraging tone that acknowledges solid progress and motivates further growth.',
  'Working towards Common Core Standards':
    'The student is making progress toward expectations. Use a constructive, supportive tone. Acknowledge effort and outline concrete next steps.',
  'Not Meeting Common Core Standards':
    'The student is not yet meeting grade-level expectations. Use a caring, solution-focused tone. Be specific about supports in place and express confidence in their ability to improve with effort.',
}

// Get grade context and tone guidance based on percentage
const getGradeContext = (grade: number | undefined) => {
  if (grade === undefined) {
    return { gradeInfo: '', toneGuidance: '' }
  }

  let level: string
  let toneGuidance: string

  if (grade >= 90) {
    level = 'Excellent (90%+)'
    toneGuidance = `The student has an excellent academic grade of ${grade.toFixed(1)}%. Use a celebratory and encouraging tone. Highlight their outstanding achievement and encourage continued excellence.`
  } else if (grade >= 80) {
    level = 'Good (80-89%)'
    toneGuidance = `The student has a good academic grade of ${grade.toFixed(1)}%. Use a positive and encouraging tone. Acknowledge their strong performance and suggest they can reach even higher with continued effort.`
  } else if (grade >= 70) {
    level = 'Satisfactory (70-79%)'
    toneGuidance = `The student has a satisfactory academic grade of ${grade.toFixed(1)}%. Use a balanced tone that acknowledges their effort while gently suggesting areas for growth.`
  } else if (grade >= 60) {
    level = 'Needs Improvement (60-69%)'
    toneGuidance = `The student has a grade of ${grade.toFixed(1)}% which needs improvement. Use a supportive and constructive tone. Focus on specific strategies for improvement and express confidence in their ability to grow.`
  } else {
    level = 'Requires Significant Support (below 60%)'
    toneGuidance = `The student has a grade of ${grade.toFixed(1)}% and requires significant support. Use a caring, supportive tone. Focus on encouragement and concrete next steps. Avoid negative language.`
  }

  return {
    gradeInfo: `- Academic Grade: ${grade.toFixed(1)}% (${level})`,
    toneGuidance,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentName, subject, coreStandards, workHabits, behavior, term, grade } = body

    if (!studentName || !coreStandards || !workHabits || !behavior) {
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
    const coreStandardsTone = CORE_STANDARDS_TONE[coreStandards] || ''

    const { gradeInfo, toneGuidance: gradeGuidance } = getGradeContext(grade)

    const prompt = `You are a helpful assistant writing progress report comments for teachers. Progress reports are mid-term check-ins (not final report cards). They should convey current standing and next steps.

Student Information:
- Name: ${studentName}
- Subject: ${subject}
- Term: ${term || 'Current Term'}
- Core Standards: ${coreStandards}
- Work Habits Rating: ${workHabitsLabel}
- Behavior Rating: ${behaviorLabel}${gradeInfo ? `\n${gradeInfo}` : ''}

Tone Guidance from Core Standards:
${coreStandardsTone}
${gradeGuidance ? `\nAdditional grade context:\n${gradeGuidance}` : ''}
Guidelines:
- Write in third person, referring to the student by their first name only (e.g., "John" not "John Smith")
- Keep the comment between 2-4 sentences
- This is a PROGRESS REPORT, so focus on current trajectory and forward-looking improvement steps
- Be specific and encouraging while honest about areas for improvement
- Do not include the letter ratings (E, G, S, N) or exact percentage in the comment
- Do not mention "Common Core Standards" literally — refer to "grade-level expectations" instead
- Write in a professional but warm tone suitable for parents to read
- End on an encouraging, forward-looking note
${grade !== undefined ? '- Reference the student\'s academic performance naturally without stating the exact grade' : ''}

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
            content: 'You are an experienced teacher writing helpful, constructive progress report comments.',
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
    console.error('Error generating progress comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
