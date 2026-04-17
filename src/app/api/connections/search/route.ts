import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  try {
    const users = await prisma.users.findMany({
      where: {
        AND: [
          {
            email: {
              equals: q,
              mode: 'insensitive'
            }
          },
          {
            id: {
              not: userId
            }
          }
        ]
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        accountType: true,
      },
      take: 20
    })

    // Fetch connections to determine relationship
    const userIds = users.map(u => u.id)
    const connections = await prisma.connections.findMany({
      where: {
        OR: [
          { requesterId: userId, receiverId: { in: userIds } },
          { receiverId: userId, requesterId: { in: userIds } }
        ],
        connectionType: 'friend'
      }
    })

    const results = users.map(user => {
      // Find connection involving this user
      const conn = connections.find(c => c.requesterId === user.id || c.receiverId === user.id)
      
      let relationshipStatus = 'Add Acquaintance'
      if (conn) {
        if (conn.status === 'accepted') {
          relationshipStatus = 'Already Acquainted'
        } else if (conn.status === 'pending') {
          if (conn.requesterId === userId) {
            relationshipStatus = 'Request Sent'
          } else {
            relationshipStatus = 'Request Received'
          }
        }
        // If rejected or removed, treat as not acquainted
      }

      return {
        ...user,
        relationshipStatus
      }
    })

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
