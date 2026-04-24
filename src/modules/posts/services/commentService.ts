import {
  getCommentById,
  getAncestorChain,
  getDirectChildren,
  getTopLevelComments,
} from '../repository/commentRepo'

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
  user: { id: string; displayName: string; avatarUrl: string | null }
}

type CommentBlob = { parent: CommentData; topChildren: CommentData[] }

export async function getBreadcrumbs(commentId: string) {
  return getAncestorChain(commentId)
}

export async function getThreadBlobs(commentId: string) {
  const focusedComment = await getCommentById(commentId)
  if (!focusedComment) return null

  const directReplies = await getDirectChildren(commentId) as CommentData[]
  const blobs: CommentBlob[] = []

  for (const reply of directReplies) {
    const children = await getDirectChildren(reply.id) as CommentData[]
    blobs.push({ parent: reply, topChildren: sortChildrenByPriority(children, reply.userId) })
  }

  return { focusedComment: focusedComment as CommentData, blobs }
}

export async function getTopLevelBlobs(postId: string) {
  const topLevelComments = await getTopLevelComments(postId) as CommentData[]
  const blobs: CommentBlob[] = []

  for (const comment of topLevelComments) {
    const children = await getDirectChildren(comment.id) as CommentData[]
    blobs.push({ parent: comment, topChildren: sortChildrenByPriority(children, comment.userId) })
  }

  return { blobs }
}

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

  otherReplies.sort((a, b) => b.likeCount - a.likeCount)

  const sorted: CommentData[] = []
  if (authorReply) sorted.push(authorReply)
  sorted.push(...otherReplies)
  return sorted.slice(0, 2)
}