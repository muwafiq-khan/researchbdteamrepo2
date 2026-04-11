import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/problems/search?q=flood
// Returns problems whose title contains the search query.
// Used by ProblemSearch component for live search.
export async function GET(request: NextRequest) {

  // Pull the "q" query parameter from the URL
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  // No query or too short — return empty array
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ problems: [] })
  }

  // Search problems using Prisma's `contains` filter.
  // `mode: 'insensitive'` makes it case-insensitive — "flood" matches "Flood".
  // We only select the 3 fields ProblemSearch needs (id, title, urgencyLevel)
  // to keep the response small.
  const problems = await prisma.problems.findMany({
    where: {
      isActive: true,
      title: {
        contains: query.trim(),
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
      urgencyLevel: true,
    },
    take: 10,
  })

  return NextResponse.json({ problems })
}
