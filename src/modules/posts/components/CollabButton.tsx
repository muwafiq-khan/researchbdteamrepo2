'use client'

import { useState } from 'react'

type CollabButtonProps = {
  postId: string
  authorId: string
  authorName: string
}

export default function CollabButton({ postId, authorId, authorName }: CollabButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'requested'>('idle')

  function handleClick() {
    if (status !== 'idle') return
    setStatus('loading')

    fetch('/api/collab-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: postId }),
    })
      .then(function(res) {
        // 409 means already requested — treat as success
        if (res.ok || res.status === 409) {
          setStatus('requested')
        } else {
          setStatus('idle')
        }
      })
      .catch(function(err) {
        console.error('Failed to send collab request:', err)
        setStatus('idle')
      })
  }

  return (
    <button
      onClick={handleClick}
      disabled={status !== 'idle'}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
        status === 'requested'
          ? 'bg-green-700 text-white border-green-700'
          : status === 'loading'
          ? 'bg-transparent text-zinc-500 border-zinc-700'
          : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-green-600 hover:text-green-400'
      }`}
    >
      {status === 'requested' ? '🤝 Requested' : status === 'loading' ? '🤝 ...' : '🤝 Collaborate'}
    </button>
  )
}
