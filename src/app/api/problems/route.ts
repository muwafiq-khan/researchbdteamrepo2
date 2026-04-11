import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {

  // Extract query params from the URL
  // request.nextUrl.searchParams is like request.GET in Django
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const fieldId = searchParams.get('fieldId')
  const subfieldId = searchParams.get('subfieldId')
  const urgency = searchParams.get('urgency')
  const country = searchParams.get('country')

  // Build the WHERE clause dynamically based on which filters are active.
  // Start with isActive: true, then add conditions.
  // Prisma's where object works like Django's Q objects / filter kwargs.
  const where: any = { isActive: true }

  if (subfieldId) {
    // If subfield is picked, filter directly — no need for field filter
    where.subfieldId = subfieldId
  } else if (fieldId) {
    // If only field is picked, filter problems whose subfield belongs to that field
    where.subfield = { fieldId: fieldId }
  }

  if (urgency) {
    where.urgencyLevel = urgency
  }

  if (country) {
    where.country = country
  }

  // skip = how many rows to skip for pagination
  // take = how many rows to return
  // skip 0, take 10 = page 1
  // skip 10, take 10 = page 2
  const problems = await prisma.problems.findMany({
    where: where,
    include: {
      subfield: {
        include: {
          field: true
        }
      }
    },
    orderBy: { urgencyLevel: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return NextResponse.json({ problems: problems })
}