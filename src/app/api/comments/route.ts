import { NextRequest, NextResponse } from 'next/server'
import {
  getTopLevelBlobs,
  getThreadBlobs,
  getBreadcrumbs,
} from '../../../modules/posts/services/commentService'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  if (type === 'top-level') {
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    const data = await getTopLevelBlobs(postId)
    return NextResponse.json({ blobs: data.blobs })
  }

  if (type === 'thread') {
    const commentId = searchParams.get('commentId')
    if (!commentId) return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    const data = await getThreadBlobs(commentId)
    if (!data) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    return NextResponse.json({ focusedComment: data.focusedComment, blobs: data.blobs })
  }

  if (type === 'ancestors') {
    const commentId = searchParams.get('commentId')
    if (!commentId) return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    const ancestors = await getBreadcrumbs(commentId)
    return NextResponse.json({ ancestors })
  }

  return NextResponse.json({ error: 'Invalid type. Use: top-level, thread, or ancestors' }, { status: 400 })
}