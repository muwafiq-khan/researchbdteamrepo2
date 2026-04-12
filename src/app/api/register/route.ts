import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, displayName, orgName, accountType } = body

    if (!email || !password || !displayName || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create the user safely inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base user
      const user = await tx.users.create({
        data: {
          email,
          passwordHash,
          displayName,
          accountType,
        }
      })

      // 2. Create the associated profile type
      if (accountType === 'researcher') {
        await tx.researchers.create({
          data: {
            userId: user.id
          }
        })
        await tx.researcher_qualifications.create({
          data: {
            researcherId: user.id
          }
        })
      } else if (accountType === 'funding_agency') {
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
      { message: 'User registered successfully', userId: result.id },
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
