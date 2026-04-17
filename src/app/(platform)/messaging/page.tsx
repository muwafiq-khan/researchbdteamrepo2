import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'
import { redirect } from 'next/navigation'
import MessagingClient from './MessagingClient'

export default async function MessagingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id

  // Fetch all acquaintances
  const acquaintanceRows = await prisma.connections.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { receiverId: userId }
      ],
      status: 'accepted',
      connectionType: 'friend'
    },
    include: {
      requester: {
        select: { id: true, displayName: true, avatarUrl: true, email: true }
      },
      receiver: {
        select: { id: true, displayName: true, avatarUrl: true, email: true }
      }
    }
  })

  // Prepare threads with last message and unread counts
  const threads = await Promise.all(acquaintanceRows.map(async (row) => {
    const otherUser = row.requesterId === userId ? row.receiver : row.requester

    // Fetch the last message between these two
    const lastMessageObj = await prisma.direct_messages.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUser.id },
          { senderId: otherUser.id, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    // Count unread messages from otherUser to me
    const unreadCount = await prisma.direct_messages.count({
      where: {
        senderId: otherUser.id,
        receiverId: userId,
        isRead: false
      }
    })

    return {
      user: otherUser,
      lastMessage: lastMessageObj ? lastMessageObj.content : null,
      lastMessageTime: lastMessageObj ? lastMessageObj.createdAt.toISOString() : null,
      unreadCount
    }
  }))

  // Sort threads by last message time (descending), pushing those without messages to the bottom
  threads.sort((a, b) => {
    if (!a.lastMessageTime) return 1
    if (!b.lastMessageTime) return -1
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  })

  return (
    <div className="py-8 px-4 flex flex-col gap-8 max-w-6xl mx-auto w-full h-full min-h-[max(calc(100vh-100px),600px)]">
      <h1 className="text-3xl font-black text-white tracking-tighter shrink-0">Messages</h1>
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        <MessagingClient initialThreads={threads} currentUserId={userId} />
      </div>
    </div>
  )
}
