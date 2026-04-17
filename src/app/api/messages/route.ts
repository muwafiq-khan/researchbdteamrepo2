import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const otherUserId = searchParams.get('otherUserId')

  if (!otherUserId) {
    return NextResponse.json({ error: 'Missing otherUserId parameters' }, { status: 400 })
  }

  try {
    // verify acquaintance relationship
    const conn = await prisma.connections.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: otherUserId },
          { requesterId: otherUserId, receiverId: userId }
        ],
        status: 'accepted'
      }
    })

    if (!conn) {
      return NextResponse.json({ error: 'Not acquainted' }, { status: 403 })
    }

    // Mark missing incoming messages as read
    await prisma.direct_messages.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Fetch conversation
    const messages = await prisma.direct_messages.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { receiverId, content } = await request.json()

  if (!receiverId || !content || !content.trim()) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const conn = await prisma.connections.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: receiverId },
          { requesterId: receiverId, receiverId: userId }
        ],
        status: 'accepted'
      }
    })

    if (!conn) {
      return NextResponse.json({ error: 'Not acquainted' }, { status: 403 })
    }

    const message = await prisma.direct_messages.create({
      data: {
        senderId: userId,
        receiverId,
        content: content.trim()
      }
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
