import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const evaluatorId = session.user.id
    const evaluateeId = params.userId

    if (!evaluateeId) {
      return NextResponse.json({ error: 'Missing evaluatee ID' }, { status: 400 })
    }

    const evaluation = await prisma.researcher_evaluations.findUnique({
      where: {
        evaluatorId_evaluateeId: {
          evaluatorId,
          evaluateeId
        }
      }
    })

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error(`Error in GET /api/evaluations/${params.userId}:`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
