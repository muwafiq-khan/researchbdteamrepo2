import { prisma } from '../../../../lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import PostDetails from '../../../../modules/posts/components/PostDetails'
import CommentSystem from '../../../../modules/posts/components/CommentSystem'
import LikeButton from '../../../../modules/posts/components/LikeButton'

type PageProps = {
  params: Promise<{ postId: string }>
}

export default async function PostViewPage({ params }: PageProps) {
  const { postId } = await params
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || null

  const post = await prisma.posts.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          displayName: true,
          avatarUrl: true,
        }
      },
      collaborationPost: true,
      helpPost: true,
      finishedWorkPost: true,
      fundingOpportunityPost: true,
      problem: true,
      reactions: {
        where: { userId: currentUserId || '' }
      },
      _count: {
        select: { reactions: true }
      },
      comments: {
        include: {
          user: {
            select: {
              displayName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!post) notFound()

  const initialLiked = post.reactions.length > 0
  const likeCount = post._count.reactions

  const postTypeColors: Record<string, string> = {
    collaboration: 'bg-blue-100 text-blue-800',
    help: 'bg-yellow-100 text-yellow-800',
    finished_work: 'bg-green-100 text-green-800',
    funding_opportunity: 'bg-purple-100 text-purple-800',
  }

  const badgeColor = postTypeColors[post.postType] ?? 'bg-gray-100 text-gray-800'

  const comments = post.comments.map((c: any) => ({
    ...c,
    createdAt: c.createdAt.toISOString()
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        href="/feed" 
        className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <span className="mr-2">←</span> Back to Feed
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <img
          src={post.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.displayName)}&background=random`}
          alt={post.author.displayName}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-800"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">{post.author.displayName}</h1>
          <p className="text-zinc-500">
            {post.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <span className={`px-3 py-1 rounded text-sm font-semibold ${badgeColor}`}>
          {post.postType.replace(/_/g, ' ')}
        </span>
      </div>

      <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
        {post.title}
      </h2>

      {/* Interactions Bar */}
      <div className="flex items-center gap-6 py-4 border-y border-zinc-800 mb-8">
        <LikeButton
          postId={post.id}
          initialCount={likeCount}
          initialLiked={initialLiked}
        />
        <div className="flex items-center gap-2 text-zinc-400">
          <span>💬</span>
          <span className="font-semibold">{comments.length} Comments</span>
        </div>
      </div>

      {post.problem && (
        <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-sm font-bold text-zinc-500 uppercase mb-2">Linked Problem</h3>
          <Link 
            href={`/problems/${post.problem.id}`}
            className="text-white hover:underline font-bold text-lg inline-flex items-center"
          >
            {post.problem.title} <span className="ml-2">↗</span>
          </Link>
        </div>
      )}

      {/* Post Details (Type-specific fields) */}
      <PostDetails post={post} />

      {/* Comment System */}
      <CommentSystem 
        postId={post.id} 
        initialComments={comments}
        currentUserId={currentUserId}
      />
    </div>
  )
}
