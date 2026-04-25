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

  const includeConfig: any = {
    researcher: {
      include: {
        researchFields: { include: { field: true } },
        publications: true,
        institutions: true,
      }
    },
    fundingAgency: true,
    receivedEvaluations: true,
  }

  if (viewerId === resolvedParams.id) {
    includeConfig.givenEvaluations = {
      include: {
        evaluatee: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    }
  }

  const profileUser = await prisma.users.findUnique({
    where: { id: resolvedParams.id },
    include: includeConfig
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
      <div className="flex flex-col justify-center items-center min-h-[50vh] text-zinc-400 font-medium px-4 text-center">
        <svg className="w-20 h-20 mb-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-3xl font-bold text-white mb-3">Profile Locked</h2>
        <p className="text-zinc-500 max-w-sm">This researcher has chosen to share their profile with acquaintances only. You must be added as an acquaintance to view this profile.</p>
      </div>
    )
  }

  // Pre-fetch all available fields for editing
  const allFields = await prisma.fields.findMany({
    select: { id: true, name: true }
  })

  // Calculate Aggregated Evaluations
  let aggregatedEvaluations = null
  if (profileUser.receivedEvaluations && profileUser.receivedEvaluations.length > 0) {
    const evals = profileUser.receivedEvaluations
    const count = evals.length
    aggregatedEvaluations = {
      count,
      punctuality: Math.round((evals.reduce((a: number, b: any) => a + b.punctualityScore, 0) / count) * 10) / 10,
      dedication: Math.round((evals.reduce((a: number, b: any) => a + b.dedicationScore, 0) / count) * 10) / 10,
      collaboration: Math.round((evals.reduce((a: number, b: any) => a + b.collaborationScore, 0) / count) * 10) / 10,
      integrity: Math.round((evals.reduce((a: number, b: any) => a + (b.integrityScore || 0), 0) / count) * 10) / 10,
      analytical: Math.round((evals.reduce((a: number, b: any) => a + (b.analyticalScore || 0), 0) / count) * 10) / 10,
      inquisitiveness: Math.round((evals.reduce((a: number, b: any) => a + (b.inquisitivenessScore || 0), 0) / count) * 10) / 10,
      adaptability: Math.round((evals.reduce((a: number, b: any) => a + (b.adaptabilityScore || 0), 0) / count) * 10) / 10,
      responsiveness: Math.round((evals.reduce((a: number, b: any) => a + (b.responsivenessScore || 0), 0) / count) * 10) / 10,
      openMindedness: Math.round((evals.reduce((a: number, b: any) => a + (b.openMindednessScore || 0), 0) / count) * 10) / 10,
    }
  }

  // Hack for Prisma DateTime to pass to Client Component (serializable)
  const serializedUser = JSON.parse(JSON.stringify(profileUser))

  return (
    <ProfileContainer 
      profileUser={serializedUser} 
      isOwner={isOwner} 
      allFields={allFields}
      aggregatedEvaluations={aggregatedEvaluations}
      givenEvaluations={profileUser.givenEvaluations ? JSON.parse(JSON.stringify(profileUser.givenEvaluations)) : []}
    />
  )
}
