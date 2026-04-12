import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, displayName, accountType, orgName } = body

    if (!email || !password || !displayName || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existing = await prisma.users.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async function(tx: Prisma.TransactionClient) {
      const user = await tx.users.create({
        data: {
          email,
          passwordHash,
          displayName,
          accountType,
          isVerified: true,
        }
      })

      if (accountType === 'researcher') {
        await tx.researchers.create({
          data: { userId: user.id }
        })
        await tx.researcher_qualifications.create({
          data: { researcherId: user.id }
        })
      }

      if (accountType === 'funding_agency') {
        await tx.funding_agencies.create({
          data: {
            userId: user.id,
            orgName: orgName || 'Unknown Organization',
          }
        })
      }

      return user
    })

    return NextResponse.json(
      { message: 'User registered successfully', userId: result.id, success: true },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
