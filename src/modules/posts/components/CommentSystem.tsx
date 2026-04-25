'use client'

import { useState } from 'react'
import Link from 'next/link'

type User = {
  id: string
  displayName: string
  avatarUrl: string | null
}

type Comment = {
  id: string
  content: string
  createdAt: string
  user: User
}

type CommentSystemProps = {
  postId: string
  initialComments: Comment[]
  currentUserId: string | null
}

export default function CommentSystem({
  postId,
  initialComments,
  currentUserId,
}: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments((prev) => [comment, ...prev])
        setNewComment('')
      } else {
        console.error('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 border-t border-zinc-800 pt-6">
      <h3 className="text-xl font-bold text-white mb-4">Comments</h3>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 min-h-[100px]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="text-zinc-500 mb-8 italic">Please sign in to join the conversation.</p>
      )}

      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Link href={`/profile/${comment.user.id}`} className="hover:opacity-80 transition-opacity flex-shrink-0">
                <img
                  src={comment.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.displayName)}&background=random`}
                  alt={comment.user.displayName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/profile/${comment.user.id}`} className="hover:underline">
                    <span className="font-bold text-white">{comment.user.displayName}</span>
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-zinc-500 italic pb-4">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  )
}
