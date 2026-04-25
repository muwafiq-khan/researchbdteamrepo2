'use client'

import { useState } from 'react'

type SaveButtonProps = {
  postId: string
  initialSaved: boolean
}

export default function SaveButton({ postId, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSave() {
    if (isLoading) return

    // Optimistic update
    const previousSaved = saved
    setSaved(!saved)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to save post')
      }

      const data = await response.json()
      setSaved(data.saved)
    } catch (error) {
      setSaved(previousSaved)
      console.error('Error toggling save:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault() // Prevent navigating to post details if nested in a link
        handleSave()
      }}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all duration-200 ${
        saved
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
          : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
      }`}
      title={saved ? 'Remove from saved' : 'Save post'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
