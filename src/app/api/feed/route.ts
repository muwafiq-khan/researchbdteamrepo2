import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    const currentUserId = session.user.id

    const posts = await prisma.posts.findMany({
      where: { visibility: 'public' },
      skip,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        reactions: {
          where: {
            userId: currentUserId
          }
        },
        follows: {
          where: {
            userId: currentUserId
          }
        },
        saves: {
          where: {
            userId: currentUserId
          }
        },
        _count: {
          select: { reactions: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const hasNextPage = posts.length > limit
    const returnPosts = hasNextPage ? posts.slice(0, limit) : posts

    const response = NextResponse.json({
      posts: returnPosts,
      nextPage: hasNextPage ? page + 1 : null,
    })

    // Add Cache-Control headers for Edge caching (stale-while-revalidate pattern)
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return response

  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
