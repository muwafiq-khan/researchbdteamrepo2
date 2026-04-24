import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'
import { notFound } from 'next/navigation'
import ProfileContainer from './ProfileContainer'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const viewerId = session?.user?.id

  if (!viewerId) return null

  const resolvedParams = await params

  const profileUser = await prisma.users.findUnique({
    where: { id: resolvedParams.id },
    include: {
      researcher: {
        include: {
          researchFields: { include: { field: true } },
          publications: true,
          institutions: true,
        }
      },
      fundingAgency: true,
    }
  })

  if (!profileUser) {
    notFound()
  }

  const isOwner = viewerId === profileUser.id

  // Check Privacy
  let canView = isOwner || profileUser.profileVisibility === 'public'
  if (!isOwner && profileUser.profileVisibility === 'friends_only') {
    // Check if they are friends
    const isFriend = await prisma.connections.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: viewerId, receiverId: profileUser.id },
          { requesterId: profileUser.id, receiverId: viewerId }
        ]
      }
    })
    if (isFriend) {
      canView = true
    }
  }

  if (!canView) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-zinc-500 font-medium text-xl">
        This profile is private
      </div>
    )
  }

  // Pre-fetch all available fields for editing
  const allFields = await prisma.fields.findMany({
    select: { id: true, name: true }
  })

  // Hack for Prisma DateTime to pass to Client Component (serializable)
  const serializedUser = JSON.parse(JSON.stringify(profileUser))

  return (
    <ProfileContainer 
      profileUser={serializedUser} 
      isOwner={isOwner} 
      allFields={allFields}
    />
  )
}
