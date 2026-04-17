import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'
import { redirect } from 'next/navigation'
import AcquaintancesClient from './AcquaintancesClient'

export default async function AcquaintancesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id

  // Fetch incoming requests
  const incomingRows = await prisma.connections.findMany({
    where: { receiverId: userId, status: 'pending', connectionType: 'friend' },
    include: {
      requester: {
        select: { id: true, displayName: true, avatarUrl: true, email: true }
      }
    }
  })
  const incomingRequests = incomingRows.map(row => ({
    connectionId: row.id,
    user: row.requester
  }))

  // Fetch outgoing requests
  const outgoingRows = await prisma.connections.findMany({
    where: { requesterId: userId, status: 'pending', connectionType: 'friend' },
    include: {
      receiver: {
        select: { id: true, displayName: true, avatarUrl: true, email: true }
      }
    }
  })
  const outgoingRequests = outgoingRows.map(row => ({
    connectionId: row.id,
    user: row.receiver
  }))

  // Fetch current acquaintances
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

  const acquaintances = acquaintanceRows.map(row => {
    // Return the other user
    const otherUser = row.requesterId === userId ? row.receiver : row.requester
    return {
      connectionId: row.id,
      user: otherUser
    }
  })

  return (
    <div className="py-8 px-4 flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-black text-white tracking-tighter">Acquaintances</h1>
      <AcquaintancesClient 
        initialIncoming={incomingRequests}
        initialOutgoing={outgoingRequests}
        initialAcquaintances={acquaintances}
      />
    </div>
  )
}
