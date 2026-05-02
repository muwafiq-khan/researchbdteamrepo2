'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import PostCard from '../../../modules/posts/components/PostCard'
import FeedSkeleton from '../../../modules/posts/components/FeedSkeleton'

type FeedClientProps = {
  currentUserId: string
}

export default function FeedClient({ currentUserId }: FeedClientProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 1, signal }) => {
      // Implement API timeout via signal and abort controller
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      // Merge signals if React Query provides one
      const mergedSignal = signal || controller.signal

      const res = await fetch(`/api/feed?page=${pageParam}&limit=10`, {
        signal: mergedSignal,
      })
      
      clearTimeout(timeout)
      
      if (!res.ok) {
        throw new Error('Network response was not ok')
      }
      return res.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  })

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    const el = loadMoreRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (status === 'pending') {
    return (
      <>
        <FeedSkeleton />
        <FeedSkeleton />
        <FeedSkeleton />
      </>
    )
  }

  if (status === 'error') {
    return <div className="text-red-500 py-4 text-center">Error loading feed.</div>
  }

  return (
    <>
      {data.pages.map((page, i) => (
        <div key={i} className="flex flex-col gap-4">
          {page.posts.map((post: any) => {
            const initialLiked = post.reactions.length > 0
            const initialFollowed = post.follows.length > 0
            const initialSaved = post.saves.length > 0
            const likeCount = post._count.reactions
            const commentCount = post._count.comments

            return (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                postType={post.postType}
                authorId={post.author.id}
                authorName={post.author.displayName}
                authorAvatar={post.author.avatarUrl ?? ''}
                createdAt={new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                likeCount={likeCount}
                initialLiked={initialLiked}
                commentCount={commentCount}
                initialFollowed={initialFollowed}
                initialSaved={initialSaved}
                currentUserId={currentUserId}
              />
            )
          })}
        </div>
      ))}
      
      {/* Invisible element to trigger intersection observer */}
      <div ref={loadMoreRef} className="h-4 w-full" />
      
      {isFetchingNextPage && <FeedSkeleton />}
      {!hasNextPage && data.pages[0]?.posts?.length > 0 && (
        <p className="text-center text-zinc-500 py-4">No more posts to show.</p>
      )}
    </>
  )
}
