'use client'

import { useState } from 'react'

type FeedFollowButtonProps = {
  postId: string
  initialFollowed: boolean
}

export default function FeedFollowButton(props: FeedFollowButtonProps) {
  const [followed, setFollowed] = useState(props.initialFollowed)
  const [isLoading, setIsLoading] = useState(false)

  async function handleFollow() {
    if (isLoading) return

    const previousFollowed = followed
    setFollowed(!followed)
    setIsLoading(true)

    const response = await fetch(`/api/posts/${props.postId}/follow`, {
      method: followed ? 'DELETE' : 'POST',
    })

    setIsLoading(false)

    if (!response.ok) {
      setFollowed(previousFollowed)
      return
    }

    const data = await response.json()
    setFollowed(data.followed)
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
        followed
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-transparent text-zinc-400 border-zinc-700'
      }`}
    >
      {followed ? '⭐ Following' : '✰ Follow Post'}
    </button>
  )
}
