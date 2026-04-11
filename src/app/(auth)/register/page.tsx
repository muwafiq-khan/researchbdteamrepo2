'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Three possible steps in our registration flow
// 'select' = choosing account type
// 'researcher' = researcher form
// 'agency' = funding agency form
// Python equivalent: a state machine with three states
type Step = 'select' | 'researcher' | 'agency'

export default function RegisterPage() {
  const router = useRouter()

  // step tracks which screen the user is currently seeing
  const [step, setStep] = useState<Step>('select')
  // <Step> tells TypeScript this state can only be 'select', 'researcher', or 'agency'
  // Python equivalent: step: Literal['select', 'researcher', 'agency'] = 'select'

  // shared fields — both account types need these
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // researcher-only field
  // orgName is only for funding agencies

  // agency-only field
  const [orgName, setOrgName] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // build the request body based on which step we're on
    // Python equivalent: payload = {'email': email, ...}
    const body = step === 'researcher'
      ? { email, password, displayName, accountType: 'researcher' }
      : { email, password, displayName, orgName, accountType: 'funding_agency' }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // JSON.stringify converts JS object to JSON string for the request body
      // Python equivalent: json.dumps(body)
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    // registration successful — go to login
    router.push('/login')
  }

  // ===== STEP 1 — ACCOUNT TYPE SELECTION =====
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="text-white font-black text-4xl tracking-tighter mb-12">
          RB
        </div>
        <h1 className="text-white text-2xl font-bold mb-2 text-center">
          Join ResearchBD
        </h1>
        <p className="text-zinc-500 text-sm mb-10 text-center">
          I am a...
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={function() { setStep('researcher') }}
            className="w-full border border-zinc-700 text-white font-semibold py-4 rounded-full hover:bg-zinc-900 transition-colors text-lg"
          >
            Researcher
          </button>
          <button
            onClick={function() { setStep('agency') }}
            className="w-full border border-zinc-700 text-white font-semibold py-4 rounded-full hover:bg-zinc-900 transition-colors text-lg"
          >
            Funding Agency
          </button>
        </div>
        <p className="text-zinc-500 text-sm text-center mt-10">
          Already have an account?{' '}
          <a href="/login" className="text-white hover:underline">
            Sign in
          </a>
        </p>
      </div>
    )
  }

  // ===== STEP 2 — REGISTRATION FORM =====
  // This renders for both researcher and agency — fields differ slightly
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-white font-black text-4xl tracking-tighter mb-8 text-center">
          RB
        </div>

        <h1 className="text-white text-2xl font-bold mb-1 text-center">
          {step === 'researcher' ? 'Create Researcher Account' : 'Create Agency Account'}
        </h1>

        {/* back button — goes back to account type selection */}
        <button
          onClick={function() { setStep('select') }}
          className="text-zinc-500 text-sm hover:text-white transition-colors mb-6 flex items-center gap-1 mx-auto"
        >
          ← Back
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={function(e) { setDisplayName(e.target.value) }}
            required
            className="w-full bg-transparent border border-zinc-700 rounded-full px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />

          {/* orgName only shows for funding agency */}
          {step === 'agency' && (
            <input
              type="text"
              placeholder="Organization Name"
              value={orgName}
              onChange={function(e) { setOrgName(e.target.value) }}
              required
              className="w-full bg-transparent border border-zinc-700 rounded-full px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={function(e) { setEmail(e.target.value) }}
            required
            className="w-full bg-transparent border border-zinc-700 rounded-full px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={function(e) { setPassword(e.target.value) }}
            required
            className="w-full bg-transparent border border-zinc-700 rounded-full px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

        </form>

      </div>
    </div>
  )
}