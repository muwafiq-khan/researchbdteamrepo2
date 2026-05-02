import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import {
  getTopLevelBlobs,
  getThreadBlobs,
  getBreadcrumbs,
  createComment,
} from '../../../modules/posts/services/commentService'

// ── GET /api/comments?type=top-level&postId=xxx ───────────────
// ── GET /api/comments?type=thread&commentId=xxx ───────────────
// ── GET /api/comments?type=ancestors&commentId=xxx ────────────

export async function GET(request: NextRequest) {

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  // ── Top-level comments for a post ───────────────────────────
  if (type === 'top-level') {
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const data = await getTopLevelBlobs(postId)

    return NextResponse.json({
      blobs: data.blobs,
    })
  }

  // ── Thread blobs for a specific comment ─────────────────────
  if (type === 'thread') {
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    const data = await getThreadBlobs(commentId)

    if (!data) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json({
      focusedComment: data.focusedComment,
      blobs: data.blobs,
    })
  }

  // ── Ancestor chain for breadcrumbs ──────────────────────────
  if (type === 'ancestors') {
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    const ancestors = await getBreadcrumbs(commentId)
    return NextResponse.json({ ancestors: ancestors })
  }

  // ── Unknown type ────────────────────────────────────────────
  return NextResponse.json(
    { error: 'Invalid type. Use: top-level, thread, or ancestors' },
    { status: 400 }
  )
}

// ── POST /api/comments ────────────────────────────────────────
// Body: { postId, content, parentId }

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { postId, content, parentId } = body

  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: 'postId and content are required' }, { status: 400 })
  }

  const comment = await createComment({
    postId: postId,
    userId: session.user.id,
    content: content.trim(),
    parentId: parentId ?? null,
  })

  return NextResponse.json({ comment: comment })
}
