import PostCard from '../../../modules/posts/components/PostCard'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function SavedPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const currentUserId = session.user.id

  // Fetch posts that the user has saved
  const savedPosts = await prisma.post_saves.findMany({
    where: { userId: currentUserId },
    include: {
      post: {
        include: {
          author: {
            select: {
              displayName: true,
              avatarUrl: true,
            }
          },
          reactions: {
            where: {
              userId: currentUserId
            }
          },
          follows: {
            where: {
              userId: currentUserId
            }
          },
          saves: {
            where: {
              userId: currentUserId
            }
          },
          _count: {
            select: { reactions: true, comments: true }
          }
        }
      }
    },
    orderBy: { savedAt: 'desc' }
  })

  return (
    <div className="py-4 px-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white px-2 mb-2 flex items-center gap-2">
        <span>🔖</span> Saved Posts
      </h1>
      
      {savedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <span className="text-4xl mb-4">🔖</span>
          <p className="text-lg font-medium">No saved posts yet</p>
          <p className="text-sm">Posts you save will appear here.</p>
        </div>
      ) : (
        savedPosts.map(function(save) {
          const post = save.post
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
              authorName={post.author.displayName}
              authorAvatar={post.author.avatarUrl ?? ''}
              createdAt={post.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              likeCount={likeCount}
              initialLiked={initialLiked}
              commentCount={commentCount}
              initialFollowed={initialFollowed}
              initialSaved={initialSaved}
            />
          )
        })
      )}
    </div>
  )
}
