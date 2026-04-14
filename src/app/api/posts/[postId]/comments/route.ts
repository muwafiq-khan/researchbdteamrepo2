import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../api/auth/[...nextauth]/route'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const comment = await prisma.post_comments.create({
      data: {
        content,
        postId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Notify post followers
    const followers = await prisma.post_follows.findMany({
      where: { postId }
    })

    const notificationsToCreate = followers
      .filter((f: any) => f.userId !== session.user.id)
      .map((f: any) => ({
        userId: f.userId,
        type: 'COMMENT',
        sourceId: session.user.id, // ID of the user who commented
        postId: postId,
      }))

    if (notificationsToCreate.length > 0) {
      await prisma.notifications.createMany({
        data: notificationsToCreate
      })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
