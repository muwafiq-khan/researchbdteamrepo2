import { prisma } from '../../../lib/prisma'

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

export async function getDirectChildren(parentId: string) {
  return prisma.post_comments.findMany({
    where: { parentId, isDeleted: false },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getTopLevelComments(postId: string) {
  return prisma.post_comments.findMany({
    where: { postId, parentId: null, isDeleted: false },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getCommentCount(postId: string) {
  return prisma.post_comments.count({
    where: { postId, isDeleted: false },
  })
}