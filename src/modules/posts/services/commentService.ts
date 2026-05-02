import {
  getCommentById,
  getAncestorChain,
  getDirectChildren,
  getTopLevelComments,
  createComment as createCommentInRepo,
} from '../repository/commentRepo'

// ============================================================
// COMMENT SERVICE
// Business logic layer. Shapes raw repo data into structures
// the client needs: blobs, breadcrumbs, priority sorting.
// ============================================================

// ── Types ────────────────────────────────────────────────────

type CommentData = {
  id: string
  postId: string
  userId: string
  parentId: string | null
  depth: number
  content: string
  isEdited: boolean
  isDeleted: boolean
  likeCount: number
  replyCount: number
  createdAt: Date
  user: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
}

type CommentBlob = {
  parent: CommentData
  topChildren: CommentData[]
}

// ── Breadcrumbs ──────────────────────────────────────────────

export async function getBreadcrumbs(commentId: string) {
  return getAncestorChain(commentId)
}

// ── Thread blobs for a focused comment ───────────────────────
// Returns the focused comment + blobs for each of its direct replies.

export async function getThreadBlobs(commentId: string) {
  const focusedComment = await getCommentById(commentId)
  if (!focusedComment) return null

  const directReplies = await getDirectChildren(commentId) as CommentData[]

  const blobs: CommentBlob[] = []

  for (const reply of directReplies) {
    const children = await getDirectChildren(reply.id) as CommentData[]
    const topTwo = sortChildrenByPriority(children, reply.userId)

    blobs.push({
      parent: reply,
      topChildren: topTwo,
    })
  }

  return {
    focusedComment: focusedComment as CommentData,
    blobs: blobs,
  }
}

// ── Top-level blobs (no focused comment) ─────────────────────

export async function getTopLevelBlobs(postId: string) {
  const topLevelComments = await getTopLevelComments(postId) as CommentData[]

  const blobs: CommentBlob[] = []

  for (const comment of topLevelComments) {
    const children = await getDirectChildren(comment.id) as CommentData[]
    const topTwo = sortChildrenByPriority(children, comment.userId)

    blobs.push({
      parent: comment,
      topChildren: topTwo,
    })
  }

  return { blobs: blobs }
}

// ── Create a comment ─────────────────────────────────────────

export async function createComment(data: {
  postId: string
  userId: string
  content: string
  parentId: string | null
}) {
  return createCommentInRepo(data)
}

// ── Priority sort ────────────────────────────────────────────
// Rule: parent author's reply first, then by likeCount desc.
// Returns top 2 only.

function sortChildrenByPriority(children: CommentData[], parentAuthorId: string): CommentData[] {
  if (children.length === 0) return []

  let authorReply: CommentData | null = null
  const otherReplies: CommentData[] = []

  for (const child of children) {
    if (child.userId === parentAuthorId && authorReply === null) {
      authorReply = child
    } else {
      otherReplies.push(child)
    }
  }

  otherReplies.sort(function(a, b) {
    return b.likeCount - a.likeCount
  })

  const sorted: CommentData[] = []
  if (authorReply) sorted.push(authorReply)
  sorted.push(...otherReplies)

  return sorted.slice(0, 2)
}
