// src/modules/posts/components/PostCard.tsx
// SERVER COMPONENT — fetches nothing, just renders props
// Contains LikeButton (Client Component) nested inside it

import LikeButton from './LikeButton'

type PostCardProps = {
  id: string
  title: string
  postType: string
  authorName: string
  authorAvatar: string
  createdAt: string
  likeCount: number
  initialLiked: boolean
}

export default function PostCard({
  id,
  title,
  postType,
  authorName,
  authorAvatar,
  createdAt,
  likeCount,
  initialLiked,
}: PostCardProps) {

  const postTypeColors: Record<string, string> = {
    collaboration: 'bg-blue-100 text-blue-800',
    help: 'bg-yellow-100 text-yellow-800',
    finished_work: 'bg-green-100 text-green-800',
    funding_opportunity: 'bg-purple-100 text-purple-800',
  }

  const badgeColor = postTypeColors[postType] ?? 'bg-gray-100 text-gray-800'

  return (
    <div className="w-full border border-zinc-800 bg-zinc-900 rounded-lg p-4">

      <div className="flex items-center gap-3 mb-3">
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="font-semibold text-white">{authorName}</span>
      </div>

      <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}>
        {postType.replace(/_/g, ' ')}
      </span>

      <h2 className="text-lg font-bold text-white mt-2 mb-1">{title}</h2>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-400">{createdAt}</span>
        <a
          href={`/posts/${id}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          View Post -&gt;
        </a>
      </div>

      {/* LikeButton is a Client Component nested inside this Server Component */}
      {/* Server Component passes postId and likeCount as props to it */}
      {/* This is the correct Next.js nesting pattern */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <LikeButton
          postId={id}
          initialCount={likeCount}
          initialLiked={initialLiked}
        />
      </div>

    </div>
  )
}
