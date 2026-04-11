'use client'
// 'use client' because this form needs interactivity —
// the user types into inputs and clicks a button.
// Server Components cannot handle user events like onClick or onChange.
// Python equivalent: this is like a Django template with JavaScript — it runs in the browser.

import { useState } from 'react'
import { signIn } from 'next-auth/react'
// signIn is NextAuth's client-side function that submits credentials
// to our POST /api/auth/signin/credentials endpoint
// Python equivalent: requests.post('/api/auth/login', data={...})
import { useRouter } from 'next/navigation'
// useRouter lets us programmatically navigate after login
// Python equivalent: redirect('/feed') in a Django view

export default function LoginPage() {
  // email and password track what the user types
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // error shows a message if login fails
  const [error, setError] = useState('')

  // loading prevents double-submits while waiting for the server
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    // e.preventDefault() stops the browser from doing a full page reload
    // Python equivalent: not needed in Django since forms POST normally,
    // but in React we handle submission manually
    e.preventDefault()
    setLoading(true)
    setError('')

    // signIn calls POST /api/auth/signin/credentials with email + password
    // redirect: false means we handle the redirect ourselves instead of
    // letting NextAuth redirect automatically — gives us control over errors
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      // result.error is set when authorize() returned null
      // meaning wrong email, wrong password, or unverified account
      setError('Invalid email or password')
      return
    }

    // login successful — navigate to feed
    router.push('/feed')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* RB Logo */}
        <div className="text-white font-black text-4xl tracking-tighter mb-8 text-center">
          RB
        </div>

        <h1 className="text-white text-2xl font-bold mb-6 text-center">
          Sign in to ResearchBD
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={function(e) { setEmail(e.target.value) }}
            className="w-full bg-transparent border border-zinc-700 rounded-full px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={function(e) { setPassword(e.target.value) }}
            className="w-full bg-transparent border border-zinc-700 rounded-full px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />

          {/* error message — only shows when error state is not empty */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

        </form>

        <p className="text-zinc-500 text-sm text-center mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-white hover:underline">
            Register
          </a>
        </p>

      </div>
    </div>
  )
}