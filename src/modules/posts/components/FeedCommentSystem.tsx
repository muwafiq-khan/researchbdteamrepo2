'use client'

import { useState } from 'react'

type FeedCommentSystemProps = {
  postId: string
  initialCount: number
}

export default function FeedCommentSystem({
  postId,
  initialCount,
}: FeedCommentSystemProps) {
  const [count, setCount] = useState(initialCount)
  const [showInput, setShowInput] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setCount((prev) => prev + 1)
        setNewComment('')
        setShowInput(false)
        // Note: In a real app, we might want to show a success toast
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
    <div className="flex-1">
      <button
        onClick={() => setShowInput(!showInput)}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <span className="text-xl">💬</span>
        <span className="text-sm font-semibold">{count}</span>
        <span className="text-sm">Comments</span>
      </button>

      {showInput && (
        <form onSubmit={handleSubmit} className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex gap-2">
            <input
              autoFocus
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              Post
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
