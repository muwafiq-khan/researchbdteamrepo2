'use client'

import { useState } from 'react'

// ── Types ────────────────────────────────────────────────────

type CommentUser = {
  id: string
  displayName: string
  avatarUrl: string | null
}

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
  createdAt: string
  user: CommentUser
}

type CommentBlob = {
  parent: CommentData
  topChildren: CommentData[]
}

type CommentSectionProps = {
  postId: string
  postTitle: string
  postAuthorName: string
  commentCount: number
}

// ── Component ────────────────────────────────────────────────

export default function CommentSection({ postId, postTitle, postAuthorName, commentCount }: CommentSectionProps) {

  // ── State ───────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false)
  const [focusedComment, setFocusedComment] = useState<CommentData | null>(null)
  const [ancestors, setAncestors] = useState<CommentData[]>([])
  const [blobs, setBlobs] = useState<CommentBlob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Handler: initial click (comment icon) ───────────────────
  function handleInitialClick() {
    setIsOpen(true)
    setIsLoading(true)
    setError(null)

    fetch('/api/comments?type=top-level&postId=' + postId)
      .then(function(res) { return res.json() })
      .then(function(data) {
        setBlobs(data.blobs)
        setFocusedComment(null)
        setAncestors([])
        setIsLoading(false)
      })
      .catch(function(err) {
        console.error('Failed to load comments:', err)
        setError('Failed to load comments')
        setIsLoading(false)
      })
  }

  // ── Handler: click into a blob (view thread) ────────────────
  // Only 1 API call now. Ancestors are tracked client-side —
  // we push the current focusedComment onto the array before
  // replacing it with the new one.
  function handleBlobClick(commentId: string) {
    setIsLoading(true)
    setError(null)

    // If we're already focused on a comment, it becomes an ancestor
    if (focusedComment) {
      setAncestors(function(prev) { return [...prev, focusedComment] })
    }

    fetch('/api/comments?type=thread&commentId=' + commentId)
      .then(function(res) { return res.json() })
      .then(function(data) {
        setFocusedComment(data.focusedComment)
        setBlobs(data.blobs)
        setIsLoading(false)
      })
      .catch(function(err) {
        console.error('Failed to load thread:', err)
        setError('Failed to load thread')
        setIsLoading(false)
      })
  }

  // ── Handler: back button ────────────────────────────────────
  // 3 cases, no ancestor API call needed for any of them:
  // 1. No focusedComment → close overlay
  // 2. Focused but no ancestors → back to top-level
  // 3. Has ancestors → pop last ancestor, load its thread
  function handleBack() {
    // Case 1: at top-level view, close the overlay
    if (!focusedComment) {
      setIsOpen(false)
      setBlobs([])
      setAncestors([])
      return
    }

    // Case 2: focused on a comment but no ancestors — return to top-level
    if (ancestors.length === 0) {
      setFocusedComment(null)
      setIsLoading(true)
      setError(null)

      fetch('/api/comments?type=top-level&postId=' + postId)
        .then(function(res) { return res.json() })
        .then(function(data) {
          setBlobs(data.blobs)
          setIsLoading(false)
        })
        .catch(function(err) {
          console.error('Failed to load comments:', err)
          setError('Failed to load comments')
          setIsLoading(false)
        })
      return
    }

    // Case 3: pop the last ancestor, fetch its thread
    var parentComment = ancestors[ancestors.length - 1]
    setAncestors(function(prev) { return prev.slice(0, -1) })
    setIsLoading(true)
    setError(null)

    fetch('/api/comments?type=thread&commentId=' + parentComment.id)
      .then(function(res) { return res.json() })
      .then(function(data) {
        setFocusedComment(data.focusedComment)
        setBlobs(data.blobs)
        setIsLoading(false)
      })
      .catch(function(err) {
        console.error('Failed to load thread:', err)
        setError('Failed to load thread')
        setIsLoading(false)
      })
  }

  // ── Handler: submit a comment ────────────────────────────────
  // parentId = focusedComment.id when in a thread, null at top-level.
  // After success: clear input and reload the current view.
  function handleSubmitComment() {
    if (!commentText.trim() || isSubmitting) return

    setIsSubmitting(true)

    var parentId = focusedComment ? focusedComment.id : null

    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: postId,
        content: commentText.trim(),
        parentId: parentId,
      }),
    })
      .then(function(res) { return res.json() })
      .then(function() {
        setCommentText('')
        setIsSubmitting(false)

        // Reload the current view so the new comment appears immediately
        if (focusedComment) {
          fetch('/api/comments?type=thread&commentId=' + focusedComment.id)
            .then(function(res) { return res.json() })
            .then(function(data) {
              setFocusedComment(data.focusedComment)
              setBlobs(data.blobs)
            })
            .catch(function(err) {
              console.error('Failed to reload thread:', err)
            })
        } else {
          fetch('/api/comments?type=top-level&postId=' + postId)
            .then(function(res) { return res.json() })
            .then(function(data) {
              setBlobs(data.blobs)
            })
            .catch(function(err) {
              console.error('Failed to reload comments:', err)
            })
        }
      })
      .catch(function(err) {
        console.error('Failed to post comment:', err)
        setIsSubmitting(false)
      })
  }

  // ── Render: just the icon (overlay closed) ──────────────────
  if (!isOpen) {
    return (
      <button
        onClick={handleInitialClick}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
          />
        </svg>
        {commentCount > 0 && (
          <span className="text-xs">{commentCount}</span>
        )}
      </button>
    )
  }

  // ── Render: overlay (comments view) ─────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {/* ── Header bar with back button ──────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
        <button
          onClick={handleBack}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-white font-bold text-lg">Comments</h2>
      </div>

      {/* ── Scrollable content area ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading state */}
        {isLoading && (
          <div className="p-6 text-center text-zinc-500 text-sm">
            Loading...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Post breadcrumb (always visible at top) ─────── */}
        {!isLoading && (
          <div className="border-b border-zinc-800">
            <button
              onClick={function() {
                setFocusedComment(null)
                setAncestors([])
                setIsLoading(true)
                setError(null)
                fetch('/api/comments?type=top-level&postId=' + postId)
                  .then(function(res) { return res.json() })
                  .then(function(data) {
                    setBlobs(data.blobs)
                    setIsLoading(false)
                  })
                  .catch(function(err) {
                    console.error('Failed to load comments:', err)
                    setError('Failed to load comments')
                    setIsLoading(false)
                  })
              }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-zinc-900/50 transition-colors"
            >
              <div className="w-0.5 h-8 bg-blue-500 rounded-full shrink-0" />
              <div className="min-w-0">
                <p className="text-zinc-500 text-xs font-medium">{postAuthorName}</p>
                <p className="text-zinc-400 text-sm truncate">{postTitle}</p>
              </div>
            </button>

            {/* ── Ancestor breadcrumbs (when inside a thread) ── */}
            {ancestors.map(function(ancestor) {
              return (
                <button
                  key={ancestor.id}
                  onClick={function() { handleBlobClick(ancestor.id) }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-0.5 h-8 bg-zinc-700 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-500 text-xs font-medium">
                      {ancestor.isDeleted ? '[deleted]' : ancestor.user.displayName}
                    </p>
                    <p className="text-zinc-400 text-sm truncate">
                      {ancestor.isDeleted ? '[this comment has been deleted]' : ancestor.content}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Focused comment (when inside a thread) ─────────── */}
        {!isLoading && focusedComment && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-zinc-700 shrink-0" />
              <div>
                <p className="text-white text-sm font-semibold">
                  {focusedComment.isDeleted ? '[deleted]' : focusedComment.user.displayName}
                </p>
                <p className="text-zinc-500 text-xs">
                  {new Date(focusedComment.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {focusedComment.isEdited && ' · edited'}
                </p>
              </div>
            </div>
            <p className="text-white text-sm leading-relaxed">
              {focusedComment.isDeleted ? '[this comment has been deleted]' : focusedComment.content}
            </p>
            <div className="flex items-center gap-4 mt-3 text-zinc-500 text-xs">
              {/* Like icon (non-functional for now) */}
              <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span>{focusedComment.likeCount}</span>
              </button>
              {/* Reply icon (non-functional for now) */}
              <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                <span>{focusedComment.replyCount}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Blobs ──────────────────────────────────────────── */}
        {!isLoading && blobs.length > 0 && (
          <div>
            {blobs.map(function(blob) {
              return (
                <div key={blob.parent.id} className="border-b border-zinc-800">

                  {/* Blob parent comment */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-zinc-700 shrink-0" />
                      <p className="text-white text-sm font-semibold">
                        {blob.parent.isDeleted ? '[deleted]' : blob.parent.user.displayName}
                      </p>
                      <span className="text-zinc-600 text-xs">
                        {new Date(blob.parent.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {blob.parent.isEdited && (
                        <span className="text-zinc-600 text-xs">· edited</span>
                      )}
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed pl-9">
                      {blob.parent.isDeleted ? '[this comment has been deleted]' : blob.parent.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 pl-9 text-zinc-500 text-xs">
                      <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span>{blob.parent.likeCount}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                        </svg>
                        <span>{blob.parent.replyCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Top 2 children */}
                  {blob.topChildren.length > 0 && (
                    <div className="ml-9 border-l-2 border-zinc-700">
                      {blob.topChildren.map(function(child) {
                        return (
                          <div key={child.id} className="px-4 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-zinc-300 text-xs font-semibold">
                                {child.isDeleted ? '[deleted]' : child.user.displayName}
                              </p>
                              <span className="text-zinc-600 text-xs">
                                {new Date(child.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                              {child.isDeleted ? '[this comment has been deleted]' : child.content}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-zinc-600 text-xs">
                              <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                                <span>{child.likeCount}</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                                </svg>
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* "Go deeper" line */}
                  {blob.parent.replyCount > 0 && (
                    <button
                      onClick={function() { handleBlobClick(blob.parent.id) }}
                      className="flex items-center gap-3 px-4 py-3 ml-9 hover:bg-zinc-900/50 transition-colors w-full text-left group"
                    >
                      <div className="w-1 h-6 bg-blue-500 rounded-full group-hover:bg-blue-400 transition-colors" />
                      <span className="text-blue-500 text-xs font-medium group-hover:text-blue-400 transition-colors">
                        View thread · {blob.parent.replyCount} replies
                      </span>
                    </button>
                  )}

                </div>
              )
            })}
          </div>
        )}

        {/* No comments state */}
        {!isLoading && blobs.length === 0 && (
          <div className="p-6 text-center text-zinc-600 text-sm">
            {focusedComment ? 'No replies yet.' : 'No comments yet.'}
          </div>
        )}

      </div>

      {/* ── Comment input box (always visible at bottom) ─────── */}
      <div className="shrink-0 border-t border-zinc-800 px-4 py-3">
        <p className="text-zinc-500 text-xs mb-1.5">
          @{focusedComment && !focusedComment.isDeleted ? focusedComment.user.displayName : postAuthorName}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={function(e) { setCommentText(e.target.value) }}
            placeholder="Write a comment..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
            className="text-blue-500 hover:text-blue-400 disabled:text-zinc-600 transition-colors text-sm font-medium px-2"
          >
            {isSubmitting ? '...' : 'Send'}
          </button>
        </div>
      </div>

    </div>
  )
}
