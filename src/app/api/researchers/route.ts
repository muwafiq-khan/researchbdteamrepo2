import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'
import { AcademicLevel } from '@prisma/client'

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  const search       = searchParams.get('search') || ''
  const fieldId      = searchParams.get('fieldId') || ''
  const academicLevel = searchParams.get('academicLevel') || ''
  const minCitations = parseInt(searchParams.get('minCitations') || '0') || 0
  const minHIndex    = parseInt(searchParams.get('minHIndex') || '0') || 0
  const sortBy       = searchParams.get('sortBy') || 'newest'
  const page         = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)

  const qualFilter = minCitations > 0 || minHIndex > 0
    ? {
        qualification: {
          ...(minCitations > 0 && { citationCount: { gte: minCitations } }),
          ...(minHIndex > 0    && { hIndex: { gte: minHIndex } }),
        },
      }
    : {}

  const where = {
    accountType: 'researcher' as const,
    appearInSearch: true,
    ...(search && {
      displayName: { contains: search, mode: 'insensitive' as const },
    }),
    researcher: {
      ...(academicLevel && { academicLevel: academicLevel as AcademicLevel }),
      ...(fieldId && { researchFields: { some: { fieldId } } }),
      ...qualFilter,
    },
  }

  const orderBy = (() => {
    switch (sortBy) {
      case 'citations':  return { researcher: { qualification: { citationCount: 'desc' as const } } }
      case 'hIndex':     return { researcher: { qualification: { hIndex: 'desc' as const } } }
      case 'qualScore':  return { researcher: { qualification: { qualificationScore: 'desc' as const } } }
      case 'pubs':       return { researcher: { qualification: { publicationCount: 'desc' as const } } }
      default:           return { createdAt: 'desc' as const }
    }
  })()

  try {
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
          createdAt: true,
          researcher: {
            select: {
              academicLevel: true,
              institution: true,
              bio: true,
              skills: true,
              researchFields: {
                select: {
                  field: { select: { id: true, name: true } },
                },
              },
              qualification: {
                select: {
                  hIndex: true,
                  citationCount: true,
                  publicationCount: true,
                  qualificationScore: true,
                  starScore: true,
                },
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
  } catch (error: unknown) {
    console.error('Researchers fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch researchers' }, { status: 500 })
  }
}
