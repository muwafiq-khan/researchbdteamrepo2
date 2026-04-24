'use client'

import { useState } from 'react'

type CommentUser = { id: string; displayName: string; avatarUrl: string | null }

type CommentData = {
  id: string; postId: string; userId: string; parentId: string | null
  depth: number; content: string; isEdited: boolean; isDeleted: boolean
  likeCount: number; replyCount: number; createdAt: string; user: CommentUser
}

type CommentBlob = { parent: CommentData; topChildren: CommentData[] }

type CommentSectionProps = {
  postId: string; postTitle: string; postAuthorName: string; commentCount: number
}

export default function CommentSection({ postId, postTitle, postAuthorName, commentCount }: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedComment, setFocusedComment] = useState<CommentData | null>(null)
  const [ancestors, setAncestors] = useState<CommentData[]>([])
  const [blobs, setBlobs] = useState<CommentBlob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadTopLevel() {
    setIsLoading(true)
    setError(null)
    fetch('/api/comments?type=top-level&postId=' + postId)
      .then(r => r.json())
      .then(data => { setBlobs(data.blobs); setIsLoading(false) })
      .catch(() => { setError('Failed to load comments'); setIsLoading(false) })
  }

  function handleInitialClick() {
    setIsOpen(true)
    setFocusedComment(null)
    setAncestors([])
    loadTopLevel()
  }

  function handleBlobClick(commentId: string) {
    setIsLoading(true)
    setError(null)
    if (focusedComment) setAncestors(prev => [...prev, focusedComment])
    fetch('/api/comments?type=thread&commentId=' + commentId)
      .then(r => r.json())
      .then(data => { setFocusedComment(data.focusedComment); setBlobs(data.blobs); setIsLoading(false) })
      .catch(() => { setError('Failed to load thread'); setIsLoading(false) })
  }

  function handleBack() {
    if (!focusedComment) { setIsOpen(false); setBlobs([]); setAncestors([]); return }
    if (ancestors.length === 0) { setFocusedComment(null); loadTopLevel(); return }
    const parent = ancestors[ancestors.length - 1]
    setAncestors(prev => prev.slice(0, -1))
    setIsLoading(true)
    fetch('/api/comments?type=thread&commentId=' + parent.id)
      .then(r => r.json())
      .then(data => { setFocusedComment(data.focusedComment); setBlobs(data.blobs); setIsLoading(false) })
      .catch(() => { setError('Failed to load thread'); setIsLoading(false) })
  }

  if (!isOpen) {
    return (
      <button onClick={handleInitialClick} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
        </svg>
        {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={handleBack} className="text-white hover:text-zinc-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-white font-bold text-lg">Comments</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-6 text-center text-zinc-500 text-sm">Loading...</div>}
        {error && <div className="p-6 text-center text-red-400 text-sm">{error}</div>}

        {!isLoading && (
          <div className="border-b border-zinc-800">
            <button onClick={() => { setFocusedComment(null); setAncestors([]); loadTopLevel() }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-zinc-900/50 transition-colors">
              <div className="w-0.5 h-8 bg-blue-500 rounded-full shrink-0" />
              <div className="min-w-0">
                <p className="text-zinc-500 text-xs font-medium">{postAuthorName}</p>
                <p className="text-zinc-400 text-sm truncate">{postTitle}</p>
              </div>
            </button>
            {ancestors.map(ancestor => (
              <button key={ancestor.id} onClick={() => handleBlobClick(ancestor.id)}
                className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-zinc-900/50 transition-colors">
                <div className="w-0.5 h-8 bg-zinc-700 rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className="text-zinc-500 text-xs font-medium">{ancestor.isDeleted ? '[deleted]' : ancestor.user.displayName}</p>
                  <p className="text-zinc-400 text-sm truncate">{ancestor.isDeleted ? '[this comment has been deleted]' : ancestor.content}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && focusedComment && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-zinc-700 shrink-0" />
              <div>
                <p className="text-white text-sm font-semibold">{focusedComment.isDeleted ? '[deleted]' : focusedComment.user.displayName}</p>
                <p className="text-zinc-500 text-xs">
                  {new Date(focusedComment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {focusedComment.isEdited && ' · edited'}
                </p>
              </div>
            </div>
            <p className="text-white text-sm leading-relaxed">{focusedComment.isDeleted ? '[this comment has been deleted]' : focusedComment.content}</p>
          </div>
        )}

        {!isLoading && blobs.length > 0 && (
          <div>
            {blobs.map(blob => (
              <div key={blob.parent.id} className="border-b border-zinc-800">
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-zinc-700 shrink-0" />
                    <p className="text-white text-sm font-semibold">{blob.parent.isDeleted ? '[deleted]' : blob.parent.user.displayName}</p>
                    <span className="text-zinc-600 text-xs">
                      {new Date(blob.parent.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {blob.parent.isEdited && <span className="text-zinc-600 text-xs">· edited</span>}
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed pl-9">{blob.parent.isDeleted ? '[this comment has been deleted]' : blob.parent.content}</p>
                </div>

                {blob.topChildren.length > 0 && (
                  <div className="ml-9 border-l-2 border-zinc-700">
                    {blob.topChildren.map(child => (
                      <div key={child.id} className="px-4 py-2">
                        <p className="text-zinc-300 text-xs font-semibold mb-1">{child.isDeleted ? '[deleted]' : child.user.displayName}</p>
                        <p className="text-zinc-400 text-sm">{child.isDeleted ? '[this comment has been deleted]' : child.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {blob.parent.replyCount > 0 && (
                  <button onClick={() => handleBlobClick(blob.parent.id)}
                    className="flex items-center gap-3 px-4 py-3 ml-9 hover:bg-zinc-900/50 transition-colors w-full text-left group">
                    <div className="w-1 h-6 bg-blue-500 rounded-full group-hover:bg-blue-400 transition-colors" />
                    <span className="text-blue-500 text-xs font-medium group-hover:text-blue-400 transition-colors">
                      View thread · {blob.parent.replyCount} replies
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && blobs.length === 0 && (
          <div className="p-6 text-center text-zinc-600 text-sm">
            {focusedComment ? 'No replies yet.' : 'No comments yet.'}
          </div>
        )}
      </div>
    </div>
  )
}