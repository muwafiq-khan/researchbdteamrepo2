import { getServerSession } from 'next-auth'
import { authOptions } from '../../../app/api/auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const notifications = await prisma.notifications.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  if (notifications.some(n => !n.read)) {
    await prisma.notifications.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true }
    })
  }

  // get source user details for the notifications map
  const sourceUserIds = notifications.map(n => n.sourceId)
  const sourceUsers = await prisma.users.findMany({
    where: { id: { in: sourceUserIds } },
    select: { id: true, displayName: true, avatarUrl: true }
  })
  const userMap = new Map(sourceUsers.map(u => [u.id, u]))

  return (
    <div className="py-8 px-4 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Notifications</h1>
      
      {notifications.length === 0 ? (
        <div className="text-zinc-400">You have no notifications yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {notifications.map((notif) => {
            const sourceUser = userMap.get(notif.sourceId)
            const isRead = notif.read
            
            let message = ''
            if (notif.type === 'COMMENT') {
              message = `commented on a post you follow.`
            } else if (notif.type === 'REACTION') {
              message = `reacted to a post you follow.`
            } else {
              message = `interacted with a post.`
            }

            return (
              <div
                key={notif.id}
                className={`flex gap-4 p-4 rounded-lg border ${
                  isRead ? 'border-zinc-800 bg-black' : 'border-zinc-600 bg-zinc-900/50'
                }`}
              >
                {sourceUser ? (
                  <Link href={`/profile/${sourceUser.id}`} className="hover:opacity-80 transition-opacity">
                    {sourceUser.avatarUrl ? (
                      <img src={sourceUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 font-bold text-white uppercase text-sm">
                        {sourceUser.displayName.charAt(0)}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 font-bold text-white uppercase text-sm">
                    ?
                  </div>
                )}
                
                <div className="flex flex-col">
                  <p className="text-white text-sm">
                    {sourceUser ? (
                      <Link href={`/profile/${sourceUser.id}`} className="font-semibold hover:underline">
                        {sourceUser.displayName}
                      </Link>
                    ) : (
                      <span className="font-semibold">Someone</span>
                    )}{' '}
                    <span className="text-zinc-300">{message}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {notif.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </p>
                  {notif.postId && (
                    <Link
                      href={`/posts/${notif.postId}`}
                      className="text-blue-400 hover:text-blue-300 text-xs mt-2 font-medium"
                    >
                      View Post
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
