import Link from 'next/link'
import { ReactNode } from 'react'
import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { FilterDataProvider } from '../../shared/providers/FilterDataProvider'
import CreatePostButton from '../../modules/posts/components/CreatePostButton'
import LogoutButton from '../../shared/components/LogoutButton'


type PlatformLayoutProps = {
  children: ReactNode
}

export default async function PlatformLayout({ children }: PlatformLayoutProps) {

  // Fetch session to get accountType for CreatePostButton
  const session = await getServerSession(authOptions)
  const accountType = session?.user?.accountType ?? 'researcher'

  let unreadCount = 0
  if (session?.user?.id) {
    unreadCount = await prisma.notifications.count({
      where: {
        userId: session.user.id,
        read: false
      }
    })
  }

  const fields = await prisma.fields.findMany({
    include: { subfields: true }
  })

  const countriesRaw = await prisma.problems.findMany({
    where: { country: { not: null } },
    select: { country: true },
    distinct: ['country']
  })
  const countries = countriesRaw.map(function(c) { return c.country as string })

  const plainFields = JSON.parse(JSON.stringify(fields))

  return (
    <FilterDataProvider fields={plainFields} countries={countries}>
      <div className="min-h-screen bg-black text-white flex flex-row">

        <aside className="hidden md:flex flex-col items-start px-4 py-4 w-64 fixed h-full border-r border-zinc-800">
          <Link href="/feed" className="text-white font-black text-3xl tracking-tighter mb-8 mt-2 px-3">
            RB
          </Link>
          <nav className="flex flex-col gap-1 w-full flex-1">
            <Link href="/profile" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>👤</span> <span>Profile</span>
            </Link>
            <Link href="/feed" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>🏠</span> <span>Feed</span>
            </Link>
            <Link href="/saved" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>🔖</span> <span>Saved</span>
            </Link>
            <Link href="/acquaintances" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>🤝</span> <span>Acquaintances</span>
            </Link>
            <Link href="/messaging" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>✉️</span> <span>Inbox</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <div className="relative">
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </Link>
            <Link href="/paraphraser" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>✍️</span> <span>Paraphraser</span>
            </Link>
            <Link href="/ai-help" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium">
              <span>🤖</span> <span>AI Help</span>
            </Link>
          </nav>
          <div className="flex flex-col gap-1 w-full mb-4">
            <button className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-900 transition-colors text-lg font-medium w-full text-left">
              <span>⚙️</span> <span>Settings</span>
            </button>
          </div>
          {/* Desktop sidebar: full-width "+ Post" button */}
          <CreatePostButton accountType={accountType} variant="sidebar" />
        </aside>

        <main className="flex-1 md:ml-64 md:mr-auto md:max-w-2xl w-full min-h-screen border-x border-zinc-800 pb-20 md:pb-0">
          <div className="sticky top-0 z-40 bg-black border-b border-zinc-800">
            <div className="flex items-center justify-between px-4 py-3 md:hidden">
              <span className="text-white font-black text-2xl tracking-tighter">RB</span>
              <LogoutButton variant="mobile" />
            </div>
            <div className="flex">
              <Link href="/feed" className="flex-1 text-center py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors border-b-2 border-transparent hover:border-white">
                Feed
              </Link>
              <Link href="/problems" className="flex-1 text-center py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors border-b-2 border-transparent hover:border-white">
                Problems
              </Link>
              <Link href="/saved" className="flex-1 text-center py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors border-b-2 border-transparent hover:border-white">
                Saved
              </Link>
            </div>
          </div>
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex justify-around items-center py-3 md:hidden z-50">
          <Link href="/profile" className="flex flex-col items-center text-white text-xl">👤</Link>
          <Link href="/feed" className="flex flex-col items-center text-white text-xl">🏠</Link>
          <Link href="/saved" className="flex flex-col items-center text-white text-xl">🔖</Link>
          <Link href="/acquaintances" className="flex flex-col items-center text-white text-xl">🤝</Link>
          <Link href="/messaging" className="flex flex-col items-center text-white text-xl">✉️</Link>
          <Link href="/notifications" className="relative flex flex-col items-center text-white text-xl">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/paraphraser" className="flex flex-col items-center text-white text-xl">✍️</Link>
          <Link href="/ai-help" className="flex flex-col items-center text-white text-xl">🤖</Link>
        </nav>

        {/* Mobile: fixed circle "+" button */}
        <CreatePostButton accountType={accountType} variant="mobile" />

        {/* Global Logout Button */}
        <LogoutButton />

      </div>
    </FilterDataProvider>
  )
}
