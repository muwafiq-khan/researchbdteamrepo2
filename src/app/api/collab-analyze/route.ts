import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'
import Groq from 'groq-sdk'

async function get_user_profile(user_id: string) {
  return prisma.users.findUnique({
    where: { id: user_id },
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
function calc_avg(evals: any[], key: string): number {
  let total = 0
  for (const e of evals) {
    total += e[key]
  }
  return total / evals.length
}

function build_eval_text(evals: any[]): string {
  if (evals.length === 0) return 'No peer evaluations yet'

  return [
    `Punctuality: ${calc_avg(evals, 'punctualityScore')}/10`,
    `Dedication: ${calc_avg(evals, 'dedicationScore')}/10`,
    `Collaboration: ${calc_avg(evals, 'collaborationScore')}/10`,
    `Integrity: ${calc_avg(evals, 'integrityScore')}/10`,
    `Analytical: ${calc_avg(evals, 'analyticalScore')}/10`,
    `Adaptability: ${calc_avg(evals, 'adaptabilityScore')}/10`,
    `Responsiveness: ${calc_avg(evals, 'responsivenessScore')}/10`,
    `Open-Mindedness: ${calc_avg(evals, 'openMindednessScore')}/10`,
  ].join(', ')
}
function build_post_summary(posts: { postType: string }[]): string {
  const post_counts: { [key: string]: number } = {}

  for (const p of posts) {
    if (post_counts[p.postType] === undefined) {
      post_counts[p.postType] = 0
    }
    post_counts[p.postType] += 1
  }

  let summary = ''
  for (const type in post_counts) {
    const label = type.replace(/_/g, ' ')
    const count = post_counts[type]
    if (summary !== '') summary += ', '
    summary += `${label} (${count})`
  }

  return summary || 'No posts yet'
}


function build_profile_text(label: string, profile: NonNullable<Awaited<ReturnType<typeof get_user_profile>>>): string {
  const r = profile.researcher
  const q = r?.qualification
  const fields      = r?.researchFields.map(function(f) { return f.field.name }).join(', ') || 'None listed'
  const skills      = r?.skills.length ? r.skills.join(', ') : 'None listed'
  const level       = r?.academicLevel ?? 'Unknown'
  const institution = r?.institution ?? 'Unknown'
  const bio         = r?.bio ?? 'No bio provided'
  const evals       = profile.receivedEvaluations
  const eval_text   = build_eval_text(evals)
  const post_summary = build_post_summary(profile.posts)

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
Peer Evaluations (avg across ${evals.length} review${evals.length !== 1 ? 's' : ''}): ${eval_text}
Post Activity: ${post_summary}
`.trim()
}

function build_prompt(my_text: string, their_text: string): string {
  return `
You are an academic collaboration advisor on ResearchBD, a research networking platform.

Analyze these two researchers and assess their collaboration potential.

${my_text}

${their_text}

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
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const target_id = new URL(request.url).searchParams.get('targetId')
  if (!target_id) {
    return NextResponse.json({ error: 'targetId is required' }, { status: 400 })
  }
  if (target_id === session.user.id) {
    return NextResponse.json({ error: 'Cannot analyze yourself' }, { status: 400 })
  }

  const api_key = process.env.GROQ_API_KEY
  if (!api_key) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const [my_profile, their_profile] = await Promise.all([
    get_user_profile(session.user.id),
    get_user_profile(target_id),
  ])

  if (!my_profile || !their_profile) {
    return NextResponse.json({ error: 'Could not find user profiles' }, { status: 404 })
  }

  const my_text    = build_profile_text('=== RESEARCHER A (You) ===', my_profile)
  const their_text = build_profile_text('=== RESEARCHER B (Potential Collaborator) ===', their_profile)
  const prompt     = build_prompt(my_text, their_text)

  try {
    const groq = new Groq({ apiKey: api_key })

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

    const raw      = completion.choices[0]?.message?.content ?? '{}'
    const analysis = JSON.parse(raw)

    return NextResponse.json(analysis)

  } catch (error: unknown) {
    console.error('collab-analyze error:', error)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}