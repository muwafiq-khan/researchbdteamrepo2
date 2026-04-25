import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'
import Groq from 'groq-sdk'

// Fetch one user's full profile for analysis
async function getUserProfile(userId: string) {
  return prisma.users.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      researcher: {
        select: {
          academicLevel: true,
          institution: true,
          bio: true,
          skills: true,
          researchFields: {
            select: { field: { select: { name: true } } },
          },
          qualification: {
            select: {
              hIndex: true,
              citationCount: true,
              publicationCount: true,
              qualificationScore: true,
              starScore: true,
              contributionPoints: true,
            },
          },
        },
      },
      receivedEvaluations: {
        select: {
          punctualityScore: true,
          dedicationScore: true,
          collaborationScore: true,
          integrityScore: true,
          analyticalScore: true,
          inquisitivenessScore: true,
          adaptabilityScore: true,
          responsivenessScore: true,
          openMindednessScore: true,
        },
      },
      posts: {
        select: { postType: true },
        take: 50,
      },
    },
  })
}

// Turn a user profile into a readable text block for the prompt
function buildProfileText(label: string, profile: NonNullable<Awaited<ReturnType<typeof getUserProfile>>>) {
  const r = profile.researcher
  const q = r?.qualification

  const fields = r?.researchFields.map(f => f.field.name).join(', ') || 'None listed'
  const skills = r?.skills.length ? r.skills.join(', ') : 'None listed'
  const level = r?.academicLevel ?? 'Unknown'
  const institution = r?.institution ?? 'Unknown'
  const bio = r?.bio ?? 'No bio provided'

  // Average the 9 peer evaluation scores
  const evals = profile.receivedEvaluations
  let evalText = 'No peer evaluations yet'
  if (evals.length > 0) {
    const avg = (key: keyof typeof evals[0]) =>
      (evals.reduce((sum, e) => sum + (e[key] as number), 0) / evals.length).toFixed(1)
    evalText = [
      `Punctuality: ${avg('punctualityScore')}/10`,
      `Dedication: ${avg('dedicationScore')}/10`,
      `Collaboration: ${avg('collaborationScore')}/10`,
      `Integrity: ${avg('integrityScore')}/10`,
      `Analytical: ${avg('analyticalScore')}/10`,
      `Adaptability: ${avg('adaptabilityScore')}/10`,
      `Responsiveness: ${avg('responsivenessScore')}/10`,
      `Open-Mindedness: ${avg('openMindednessScore')}/10`,
    ].join(', ')
  }

  // Summarise their post activity
  const postCounts: Record<string, number> = {}
  for (const p of profile.posts) {
    postCounts[p.postType] = (postCounts[p.postType] || 0) + 1
  }
  const postSummary = Object.entries(postCounts)
    .map(([type, count]) => `${type.replace(/_/g, ' ')} (${count})`)
    .join(', ') || 'No posts yet'

  return `
${label}
Name: ${profile.displayName}
Academic Level: ${level}
Institution: ${institution}
Bio: ${bio}
Research Fields: ${fields}
Skills: ${skills}
H-Index: ${q?.hIndex ?? 0} | Citations: ${q?.citationCount ?? 0} | Publications: ${q?.publicationCount ?? 0}
Qualification Score: ${q?.qualificationScore ?? 0} | Star Rating: ${q?.starScore ?? 0}
Peer Evaluations (avg across ${evals.length} review${evals.length !== 1 ? 's' : ''}): ${evalText}
Post Activity: ${postSummary}
`.trim()
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targetId = new URL(request.url).searchParams.get('targetId')
  if (!targetId) {
    return NextResponse.json({ error: 'targetId is required' }, { status: 400 })
  }
  if (targetId === session.user.id) {
    return NextResponse.json({ error: 'Cannot analyze yourself' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  // Fetch both profiles in parallel
  const [myProfile, theirProfile] = await Promise.all([
    getUserProfile(session.user.id),
    getUserProfile(targetId),
  ])

  if (!myProfile || !theirProfile) {
    return NextResponse.json({ error: 'Could not find user profiles' }, { status: 404 })
  }

  const myText    = buildProfileText('=== RESEARCHER A (You) ===', myProfile)
  const theirText = buildProfileText('=== RESEARCHER B (Potential Collaborator) ===', theirProfile)

  const prompt = `
You are an academic collaboration advisor on ResearchBD, a research networking platform.

Analyze these two researchers and assess their collaboration potential.

${myText}

${theirText}

Based on their fields, skills, metrics, peer evaluations, and activity patterns — provide a structured JSON analysis.

Return ONLY valid JSON in this exact format, nothing else:
{
  "compatibility": "High" or "Medium" or "Low",
  "summary": "2-3 sentence overview of collaboration potential",
  "pros": ["reason 1", "reason 2", "reason 3"],
  "cons": ["reason 1", "reason 2"],
  "risks": ["risk 1", "risk 2"]
}
`.trim()

  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an academic collaboration advisor. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const analysis = JSON.parse(raw)

    return NextResponse.json(analysis)
  } catch (error: unknown) {
    console.error('collab-analyze error:', error)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
