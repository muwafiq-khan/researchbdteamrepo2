'use client'

import { useState } from 'react'
import Link from 'next/link'

type CollabButtonProps = {
  authorId: string
  authorName: string
}

export default function CollabButton({ authorId, authorName }: CollabButtonProps) {
  const [requested, setRequested] = useState(false)

  // Clicking flags intent and opens their profile in a new tab
  function handleClick() {
    setRequested(true)
  }

  return (
    <Link
      href={`/profile/${authorId}`}
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
        requested
          ? 'bg-green-700 text-white border-green-700'
          : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-green-600 hover:text-green-400'
      }`}
    >
      {requested ? '🤝 Connecting' : '🤝 Collaborate'}
    </Link>
  )
}
