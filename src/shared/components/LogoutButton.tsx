'use client'

import { signOut } from 'next-auth/react'

type LogoutButtonProps = {
  variant?: 'global' | 'mobile'
}

export default function LogoutButton({ variant = 'global' }: LogoutButtonProps) {
  const handleLogout = () => signOut({ callbackUrl: '/login' })

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleLogout}
        className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
      >
        Sign Out
      </button>
    )
  }

  // Global variant for desktop (fixed top right)
  return (
    <button
      onClick={handleLogout}
      className="fixed top-4 right-6 z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-5 py-2 rounded-full font-medium transition-colors text-sm shadow-lg hidden md:block"
    >
      Sign Out
    </button>
  )
}
