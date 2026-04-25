import PostCard from '../../../modules/posts/components/PostCard'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../app/api/auth/[...nextauth]/route'
import FilterIconButton from '../../../shared/components/FilterIconButton'
import GlobalFilterOverlay from '../../../shared/components/GlobalFilterOverlay'
import { redirect } from 'next/navigation'

export default async function FeedPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const currentUserId = session.user.id

  const posts = await prisma.posts.findMany({
    where: { visibility: 'public' },
    include: {
      author: {
        select: {
          id: true,
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
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="py-4 px-4 flex flex-col gap-4">
      <div className="flex justify-end">
        <FilterIconButton />
      </div>
      {posts.map(function(post) {
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
            currentUserId={currentUserId}
          />
        )
      })}
      <GlobalFilterOverlay />
    </div>
  )
}
