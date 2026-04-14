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

  try {
    await prisma.post_follows.upsert({
      where: {
        userId_postId: { userId, postId }
      },
      update: {},
      create: {
        userId,
        postId
      }
    })

    return NextResponse.json({ followed: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to follow post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const params = await context.params
  const postId = params.postId

  try {
    const existing = await prisma.post_follows.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    })

    if (existing) {
      await prisma.post_follows.delete({
        where: {
          userId_postId: { userId, postId }
        }
      })
    }

    return NextResponse.json({ followed: false })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to unfollow post' }, { status: 500 })
  }
}
