'use client'

import { useState } from 'react'

type LikeButtonProps = {
  postId: string
  initialCount: number
  initialLiked: boolean
  // initialLiked — did the CURRENT logged in user already like this post?
  // we'll pass this from the feed page so the button shows correct state on load
}

export default function LikeButton(props: LikeButtonProps) {

  const [liked, setLiked] = useState(props.initialLiked)
  const [count, setCount] = useState(props.initialCount)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLike() {
    // prevent double clicks while request is in flight
    if (isLoading) return

    // optimistic update — update UI immediately before server responds
    // feels instant to the user
    // if server fails, we roll back
    const previousLiked = liked
    const previousCount = count

    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)
    setIsLoading(true)

    const response = await fetch(`/api/posts/${props.postId}/react`, {
      method: 'POST',
    })

    setIsLoading(false)

    if (!response.ok) {
      // server failed — roll back to previous state
      setLiked(previousLiked)
      setCount(previousCount)
      return
    }

    const data = await response.json()
    // sync with server's actual count — source of truth
    setCount(data.newCount)
    setLiked(data.liked)
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
        liked
          ? 'bg-white text-black border-white'
          : 'bg-transparent text-zinc-400 border-zinc-700'
      }`}
    >
      👍 {count}
    </button>
  )
}