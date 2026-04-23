import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const evaluatorId = session.user.id
    const body = await req.json()
    const { 
      evaluateeId, 
      punctualityScore, 
      dedicationScore, 
      collaborationScore, 
      integrityScore,
      analyticalScore,
      inquisitivenessScore,
      adaptabilityScore,
      responsivenessScore,
      openMindednessScore,
      feedback 
    } = body

    if (!evaluateeId || !punctualityScore || !dedicationScore || !collaborationScore || !integrityScore || !analyticalScore || !inquisitivenessScore || !adaptabilityScore || !responsivenessScore || !openMindednessScore) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (evaluatorId === evaluateeId) {
      return NextResponse.json({ error: 'You cannot evaluate yourself' }, { status: 400 })
    }

    // Upsert the evaluation
    const evaluation = await prisma.researcher_evaluations.upsert({
      where: {
        evaluatorId_evaluateeId: {
          evaluatorId,
          evaluateeId
        }
      },
      update: {
        punctualityScore: Number(punctualityScore),
        dedicationScore: Number(dedicationScore),
        collaborationScore: Number(collaborationScore),
        integrityScore: Number(integrityScore),
        analyticalScore: Number(analyticalScore),
        inquisitivenessScore: Number(inquisitivenessScore),
        adaptabilityScore: Number(adaptabilityScore),
        responsivenessScore: Number(responsivenessScore),
        openMindednessScore: Number(openMindednessScore),
        feedback: feedback || null
      },
      create: {
        evaluatorId,
        evaluateeId,
        punctualityScore: Number(punctualityScore),
        dedicationScore: Number(dedicationScore),
        collaborationScore: Number(collaborationScore),
        integrityScore: Number(integrityScore),
        analyticalScore: Number(analyticalScore),
        inquisitivenessScore: Number(inquisitivenessScore),
        adaptabilityScore: Number(adaptabilityScore),
        responsivenessScore: Number(responsivenessScore),
        openMindednessScore: Number(openMindednessScore),
        feedback: feedback || null
      }
    })

    // Now recalculate the evaluatee's starScore in researcher_qualifications
    const allEvaluations = await prisma.researcher_evaluations.findMany({
      where: { evaluateeId }
    })

    if (allEvaluations.length > 0) {
      let totalPunctuality = 0
      let totalDedication = 0
      let totalCollaboration = 0
      let totalIntegrity = 0
      let totalAnalytical = 0
      let totalInquisitiveness = 0
      let totalAdaptability = 0
      let totalResponsiveness = 0
      let totalOpenMindedness = 0

      for (const ev of allEvaluations) {
        totalPunctuality += ev.punctualityScore
        totalDedication += ev.dedicationScore
        totalCollaboration += ev.collaborationScore
        totalIntegrity += ev.integrityScore
        totalAnalytical += ev.analyticalScore
        totalInquisitiveness += ev.inquisitivenessScore
        totalAdaptability += ev.adaptabilityScore
        totalResponsiveness += ev.responsivenessScore
        totalOpenMindedness += ev.openMindednessScore
      }

      const count = allEvaluations.length
      const avgPunctuality = totalPunctuality / count
      const avgDedication = totalDedication / count
      const avgCollaboration = totalCollaboration / count
      const avgIntegrity = totalIntegrity / count
      const avgAnalytical = totalAnalytical / count
      const avgInquisitiveness = totalInquisitiveness / count
      const avgAdaptability = totalAdaptability / count
      const avgResponsiveness = totalResponsiveness / count
      const avgOpenMindedness = totalOpenMindedness / count

      // Overall star score can be the average of all averages
      const newStarScore = (avgPunctuality + avgDedication + avgCollaboration + avgIntegrity + avgAnalytical + avgInquisitiveness + avgAdaptability + avgResponsiveness + avgOpenMindedness) / 9

      // Update the qualifications. If researcher doesn't exist, we skip or handle it gracefully.
      // The evaluatee might be a researcher or funding agency. We only update if they are a researcher.
      const researcherCheck = await prisma.researchers.findUnique({
        where: { userId: evaluateeId }
      })

      if (researcherCheck) {
        // Upsert qualifications in case it doesn't exist
        await prisma.researcher_qualifications.upsert({
          where: { researcherId: evaluateeId },
          update: {
            starScore: newStarScore,
          },
          create: {
            researcherId: evaluateeId,
            starScore: newStarScore,
          }
        })
      }
    }

    return NextResponse.json({ success: true, evaluation })
  } catch (error) {
    console.error('Error in POST /api/evaluations:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
