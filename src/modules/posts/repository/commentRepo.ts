import { prisma } from '../../../lib/prisma'

// ============================================================
// COMMENT REPO
// Pure database access layer. Every function here does ONE thing:
// run a Prisma query and return the result. No business logic,
// no sorting, no data transformation.
// ============================================================

// Shared select object — used by every comment query.
// Defined once so we don't repeat the same 15 fields everywhere.
const COMMENT_SELECT = {
  id: true,
  postId: true,
  userId: true,
  parentId: true,
  depth: true,
  content: true,
  isEdited: true,
  isDeleted: true,
  likeCount: true,
  replyCount: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
    },
  },
}

export async function getCommentById(commentId: string) {
  return prisma.post_comments.findUnique({
    where: { id: commentId },
    select: COMMENT_SELECT,
  })
}

// Walk up the parent chain to build breadcrumbs.
// Returns array in top-down order: [oldest ancestor, ..., direct parent]
// Does NOT include the comment itself.
export async function getAncestorChain(commentId: string) {
  const ancestors = []

  let current = await prisma.post_comments.findUnique({
    where: { id: commentId },
    select: { parentId: true },
  })

  while (current?.parentId) {
    const parent = await prisma.post_comments.findUnique({
      where: { id: current.parentId },
      select: COMMENT_SELECT,
    })
    if (!parent) break

    ancestors.unshift(parent)
    current = { parentId: parent.parentId }
  }

  return ancestors
}

// Fetch direct children of a comment.
// Service layer sorts these and picks top 2 per blob.
export async function getDirectChildren(parentId: string) {
  return prisma.post_comments.findMany({
    where: {
      parentId: parentId,
      isDeleted: false,
    },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

// Fetch top-level comments for a post (parentId = null).
export async function getTopLevelComments(postId: string) {
  return prisma.post_comments.findMany({
    where: {
      postId: postId,
      parentId: null,
      isDeleted: false,
    },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

// Count all comments on a post (for the chat icon badge).
export async function getCommentCount(postId: string) {
  return prisma.post_comments.count({
    where: {
      postId: postId,
      isDeleted: false,
    },
  })
}

// Create a new comment.
// Computes depth from parent, increments parent's replyCount if replying.
export async function createComment(data: {
  postId: string
  userId: string
  content: string
  parentId: string | null
}) {
  var depth = 0

  if (data.parentId) {
    const parent = await prisma.post_comments.findUnique({
      where: { id: data.parentId },
      select: { depth: true },
    })

    if (parent) {
      depth = parent.depth + 1
    }

    // Bump the parent's replyCount so the "View thread · N replies" line stays accurate
    await prisma.post_comments.update({
      where: { id: data.parentId },
      data: { replyCount: { increment: 1 } },
    })
  }

  return prisma.post_comments.create({
    data: {
      postId: data.postId,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId,
      depth: depth,
      isEdited: false,
      isDeleted: false,
      likeCount: 0,
      replyCount: 0,
    },
    select: COMMENT_SELECT,
  })
}
