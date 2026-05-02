import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Read filter values from URL
  const params        = new URL(request.url).searchParams
  const fieldId       = params.get('fieldId') || ''
  const academicLevel = params.get('academicLevel') || ''
  const minCitations  = parseInt(params.get('minCitations') || '0') || 0
  const minHIndex     = parseInt(params.get('minHIndex') || '0') || 0
  const sortBy        = params.get('sortBy') || 'newest'
  const page          = Math.max(1, parseInt(params.get('page') || '1') || 1)

  // Build WHERE — only add a condition if that filter has a value
  const where: any = {
    accountType: 'researcher',
    appearInSearch: true,
  }

  where.researcher = {}

  if (academicLevel) {
    where.researcher.academicLevel = academicLevel
  }

  if (fieldId) {
    where.researcher.researchFields = { some: { fieldId } }
  }

  if (minCitations > 0 || minHIndex > 0) {
    where.researcher.qualification = {}
    if (minCitations > 0) where.researcher.qualification.citationCount = { gte: minCitations }
    if (minHIndex > 0)    where.researcher.qualification.hIndex        = { gte: minHIndex }
  }

  // Build ORDER BY
  let orderBy: any = { createdAt: 'desc' }
  if (sortBy === 'citations')    orderBy = { researcher: { qualification: { citationCount:      'desc' } } }
  if (sortBy === 'hIndex')       orderBy = { researcher: { qualification: { hIndex:             'desc' } } }
  if (sortBy === 'qualScore')    orderBy = { researcher: { qualification: { qualificationScore: 'desc' } } }
  if (sortBy === 'pubs')         orderBy = { researcher: { qualification: { publicationCount:   'desc' } } }
  if (sortBy === 'alphabetical') orderBy = { researcher: { name: 'desc' } }

  // Fetch page of results + total count at the same time
  const [researchers, total] = await Promise.all([
    prisma.users.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        researcher: {
          select: {
            academicLevel: true,
            institution: true,
            bio: true,
            researchFields: { select: { field: { select: { id: true, name: true } } } },
            qualification: {
              select: { hIndex: true, citationCount: true, publicationCount: true, qualificationScore: true },
            },
          },
        },
      },
    }),
    prisma.users.count({ where }),
  ])

  return NextResponse.json({
    researchers,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  })
}
