import { NextRequest, NextResponse } from 'next/server'

// Rating scale labels
const DBIN_LABELS: Record<string, string> = {
  D: 'Developing',
  B: 'Beginning',
  I: 'Improvement needed',
  N: 'Not Assessed',
}

const BGDVNI_LABELS: Record<string, string> = {
  BG: 'Beginning',
  DV: 'Developing',
  NI: 'Needs Improvement',
}

const LEARNING_SKILL_LABELS: Record<string, string> = {
  E: 'Excellent',
  G: 'Good',
  S: 'Satisfactory',
  N: 'Needs Improvement',
}

// Determine tone based on the distribution of ratings in a domain
const getToneGuidance = (
  skills: Array<{ name: string; rating: string }>,
  ratingScale: string
) => {
  const ratedSkills = skills.filter((s) => s.rating && s.rating !== 'N')
  if (ratedSkills.length === 0) {
    return 'The student has not yet been assessed in most areas. Use a neutral, forward-looking tone that focuses on goals and expectations for the coming period.'
  }

  // Count positive vs. concerning ratings
  const positiveRatings =
    ratingScale === 'DBIN'
      ? ratedSkills.filter((s) => s.rating === 'D').length
      : ratedSkills.filter((s) => s.rating === 'DV').length

  const concerningRatings =
    ratingScale === 'DBIN'
      ? ratedSkills.filter((s) => s.rating === 'I').length
      : ratedSkills.filter((s) => s.rating === 'NI').length

  const positiveRatio = positiveRatings / ratedSkills.length

  if (positiveRatio >= 0.7) {
    return 'The student is progressing well in this area. Use a celebratory, encouraging tone. Highlight specific strengths and encourage continued growth.'
  } else if (positiveRatio >= 0.4) {
    return 'The student shows mixed progress in this area. Use a balanced, supportive tone. Acknowledge strengths while gently identifying areas for growth with specific suggestions.'
  } else if (concerningRatings > positiveRatings) {
    return 'The student needs additional support in this area. Use a caring, constructive tone. Focus on encouragement, concrete next steps, and express confidence in the child\'s ability to grow. Avoid negative language.'
  } else {
    return 'The student is making early progress in this area. Use an encouraging, patient tone. Highlight emerging skills and suggest ways families can support continued development.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentName,
      domainName,
      skills,
      ratingScale,
      gradeLevel,
      documentType,
      learningSkills,
      term,
    } = body

    if (!studentName || !domainName || !skills || !Array.isArray(skills) || !ratingScale) {
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

    // Map rating labels based on scale
    const ratingLabels = ratingScale === 'DBIN' ? DBIN_LABELS : BGDVNI_LABELS
    const scaleName =
      ratingScale === 'DBIN'
        ? 'D (Developing), B (Beginning), I (Improvement needed), N (Not Assessed)'
        : 'BG (Beginning), DV (Developing), NI (Needs Improvement)'

    // Build skill ratings summary
    const skillSummary = skills
      .map((s: { name: string; rating: string; description?: string }) => {
        const label = ratingLabels[s.rating] || s.rating || 'Not Assessed'
        const desc = s.description ? ` — ${s.description}` : ''
        return `  - ${s.name}${desc}: ${label}`
      })
      .join('\n')

    // Build learning skills context if available
    let learningSkillsContext = ''
    if (learningSkills && Array.isArray(learningSkills) && learningSkills.length > 0) {
      const lsSummary = learningSkills
        .filter((ls: { name: string; rating: string }) => ls.rating)
        .map((ls: { name: string; rating: string }) => {
          const label = LEARNING_SKILL_LABELS[ls.rating] || ls.rating
          return `  - ${ls.name}: ${label}`
        })
        .join('\n')

      if (lsSummary) {
        learningSkillsContext = `\nLearning Skills (for additional context about the student's overall behavior and habits):\n${lsSummary}\n`
      }
    }

    // Get tone guidance
    const toneGuidance = getToneGuidance(skills, ratingScale)

    const gradeLevelLabel = gradeLevel === 'JK' ? 'Junior Kindergarten' : 'Senior Kindergarten'
    const docTypeLabel = documentType === 'progress_report' ? 'Progress Report' : 'Report Card'

    const prompt = `You are a helpful assistant writing ${docTypeLabel.toLowerCase()} comments for an early childhood educator. Generate a professional, warm, and developmentally appropriate comment for a kindergarten student.

Student Information:
- Name: ${studentName}
- Grade Level: ${gradeLevelLabel}
- Term: ${term || 'Current Term'}
- Document Type: ${docTypeLabel}
- Domain/Section: ${domainName}
- Rating Scale: ${scaleName}

Skill Ratings for ${domainName}:
${skillSummary}
${learningSkillsContext}
Tone Guidance:
${toneGuidance}

Guidelines:
- Write in third person, referring to the student by their first name only (e.g., "Ahmed" not "Ahmed Smith")
- Keep the comment between 2-4 sentences
- Use warm, developmentally appropriate language suitable for early childhood education
- Reference specific skills and the child's progress naturally — do NOT list skills mechanically
- Do NOT include the rating codes (D, B, I, N, BG, DV, NI) in the comment
- Focus on developmental milestones and growth rather than academic grades
- Be encouraging and highlight what the child CAN do before addressing areas for growth
- For progress reports, focus on trajectory and next steps
- For report cards, provide a summary of the term's development
- End on a positive or forward-looking note
- Write in a professional but warm tone suitable for parents to read

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
            content:
              'You are an experienced early childhood educator writing helpful, developmental progress comments for kindergarten students. Your comments are warm, specific, and focused on the whole child.',
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
    console.error('Error generating JK/SK comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
