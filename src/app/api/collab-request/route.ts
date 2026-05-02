import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

// ── POST /api/collab-request ──────────────────────────────────
// Body: { postId }
// Creates a collaboration_request row and notifies the post author.

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { postId } = body

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  // Fetch the post to get its author
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { authorId: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Cannot request to collaborate on your own post
  if (post.authorId === session.user.id) {
    return NextResponse.json({ error: 'Cannot collaborate on your own post' }, { status: 400 })
  }

  // Prevent duplicate requests
  const existing = await prisma.collaboration_requests.findFirst({
    where: {
      researcherId: session.user.id,
      postId: postId,
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already requested' }, { status: 409 })
  }

  // Create the collaboration request
  await prisma.collaboration_requests.create({
    data: {
      researcherId: session.user.id,
      postId: postId,
      status: 'pending',
    },
  })

  // Notify the post author
  await prisma.notifications.create({
    data: {
      userId: post.authorId,
      type: 'collab_request',
      sourceId: session.user.id,
      postId: postId,
      read: false,
    },
  })

  return NextResponse.json({ success: true })
}
