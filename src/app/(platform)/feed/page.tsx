import { getServerSession } from 'next-auth'
import { authOptions } from '../../../app/api/auth/[...nextauth]/route'
import FilterIconButton from '../../../shared/components/FilterIconButton'
import GlobalFilterOverlay from '../../../shared/components/GlobalFilterOverlay'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import FeedSkeleton from '../../../modules/posts/components/FeedSkeleton'

const FeedClient = dynamic(() => import('./FeedClient'), {
  loading: () => (
    <>
      <FeedSkeleton />
      <FeedSkeleton />
      <FeedSkeleton />
    </>
  )
})

export default async function FeedPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const currentUserId = session.user.id

  return (
    <div className="py-4 px-4 flex flex-col gap-4">
      <div className="flex justify-end">
        <FilterIconButton />
      </div>
      
      <FeedClient currentUserId={currentUserId} />
      
      <GlobalFilterOverlay />
    </div>
  )
}
