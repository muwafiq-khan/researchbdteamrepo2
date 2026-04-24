import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const resolvedParams = await params
  
  if (!session?.user?.id || session.user.id !== resolvedParams.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Update basic user info
    await prisma.users.update({
      where: { id: resolvedParams.id },
      data: {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        profileVisibility: data.profileVisibility,
        appearInSearch: data.appearInSearch,
      }
    })

    if (data.accountType === 'researcher') {
      await prisma.researchers.update({
        where: { userId: resolvedParams.id },
        data: {
          bio: data.bio,
          skills: data.skills, // array of strings
        }
      })

      // Update publications
      await prisma.publications.deleteMany({ where: { researcherId: resolvedParams.id } })
      if (data.publications && data.publications.length > 0) {
        const validPubs = data.publications.filter((p: any) => p.title && p.title.trim() !== '')
        if (validPubs.length > 0) {
          await prisma.publications.createMany({
            data: validPubs.map((p: any) => ({
              researcherId: resolvedParams.id,
              title: p.title,
              journalOrConferenceName: p.journalOrConferenceName || '',
              year: parseInt(p.year) || new Date().getFullYear(),
              coAuthors: p.coAuthors,
              linkOrDoi: p.linkOrDoi
            }))
          })
        }
      }

      // Update institutions
      await prisma.institutions.deleteMany({ where: { researcherId: resolvedParams.id } })
      if (data.institutions && data.institutions.length > 0) {
        const validInsts = data.institutions.filter((i: any) => i.institutionName && i.institutionName.trim() !== '')
        if (validInsts.length > 0) {
          await prisma.institutions.createMany({
            data: validInsts.map((i: any) => ({
              researcherId: resolvedParams.id,
              institutionName: i.institutionName,
              rolePosition: i.rolePosition || '',
              startDate: i.startDate ? new Date(i.startDate) : new Date(),
              endDate: i.endDate ? new Date(i.endDate) : null
            }))
          })
        }
      }

      // Update research fields
      await prisma.researcher_fields.deleteMany({ where: { researcherId: resolvedParams.id } })
      if (data.researchFieldIds && data.researchFieldIds.length > 0) {
        const uniqueFieldIds = Array.from(new Set(data.researchFieldIds))
        await prisma.researcher_fields.createMany({
          data: uniqueFieldIds.map((id: any) => ({
            researcherId: resolvedParams.id,
            fieldId: id
          }))
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
