import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '../../../../../lib/prisma'

export async function POST(req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const params = await context.params
  const postId = params.postId

  const existingSave = await prisma.post_saves.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  })

  if (existingSave) {
    await prisma.post_saves.delete({
      where: {
        userId_postId: { userId, postId }
      }
    })
  } else {
    await prisma.post_saves.create({
      data: {
        userId,
        postId,
      }
    })
  }

  return NextResponse.json({
    saved: !existingSave,
  })
}
