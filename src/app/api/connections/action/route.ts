import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const { action, targetUserId } = body

  if (!action || !targetUserId) {
    return NextResponse.json({ error: 'Action and targetUserId are required' }, { status: 400 })
  }

  if (userId === targetUserId) {
    return NextResponse.json({ error: 'Cannot perform action on yourself' }, { status: 400 })
  }

  try {
    // Check if an existing connection exists
    const existingConn = await prisma.connections.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: userId }
        ],
        connectionType: 'friend'
      }
    })

    if (action === 'send') {
      if (existingConn) {
        if (existingConn.status === 'pending') {
          return NextResponse.json({ error: 'Request already exists' }, { status: 400 })
        }
        if (existingConn.status === 'accepted') {
          return NextResponse.json({ error: 'Already acquainted' }, { status: 400 })
        }
        // If rejected or removed, we can 're-send'
        await prisma.connections.update({
          where: { id: existingConn.id },
          data: {
            requesterId: userId,
            receiverId: targetUserId,
            status: 'pending'
          }
        })
      } else {
        await prisma.connections.create({
          data: {
            requesterId: userId,
            receiverId: targetUserId,
            connectionType: 'friend',
            status: 'pending'
          }
        })
      }

      // Create notification
      await prisma.notifications.create({
        data: {
          userId: targetUserId,
          type: 'acquaintance_request',
          sourceId: userId
        }
      })

    } else if (action === 'accept') {
      if (!existingConn || existingConn.status !== 'pending' || existingConn.receiverId !== userId) {
        return NextResponse.json({ error: 'No pending request found' }, { status: 400 })
      }
      await prisma.connections.update({
        where: { id: existingConn.id },
        data: { status: 'accepted' }
      })

      // Create notification for the requester
      await prisma.notifications.create({
        data: {
          userId: existingConn.requesterId,
          type: 'acquaintance_accepted',
          sourceId: userId
        }
      })
    } else if (action === 'decline') {
      if (!existingConn || existingConn.status !== 'pending' || existingConn.receiverId !== userId) {
        return NextResponse.json({ error: 'No pending request found' }, { status: 400 })
      }
      // Instead of updating, deleting might be cleaner, but let's use 'rejected'
      await prisma.connections.delete({
        where: { id: existingConn.id }
      })
    } else if (action === 'cancel') {
      if (!existingConn || existingConn.status !== 'pending' || existingConn.requesterId !== userId) {
        return NextResponse.json({ error: 'No pending outward request found' }, { status: 400 })
      }
      await prisma.connections.delete({
        where: { id: existingConn.id }
      })
    } else if (action === 'remove') {
      if (!existingConn || existingConn.status !== 'accepted') {
        return NextResponse.json({ error: 'Not acquainted' }, { status: 400 })
      }
      await prisma.connections.delete({
        where: { id: existingConn.id }
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Connection action error:', error)
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 })
  }
}
