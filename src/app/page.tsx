'use client'

// useRouter — client-side navigation (we need to redirect AFTER the splash is visible)
// useEffect — run the timer after the component mounts to the DOM
// useState  — flip opacity from 0→1 to trigger the CSS fade-in transition
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SplashPage() {

  const router = useRouter()

  // starts false (invisible) — flipped to true on mount to trigger fade-in
  const [visible, setVisible] = useState(false)

  useEffect(function () {

    // Flip opacity immediately after mount.
    // Why requestAnimationFrame? React batches state updates. If we call
    // setVisible(true) directly in useEffect, the browser might merge the
    // initial render (opacity-0) and the update (opacity-1) into one paint,
    // skipping the transition entirely. requestAnimationFrame guarantees the
    // browser has painted the opacity-0 frame first, THEN we flip to opacity-1
    // on the next frame — giving CSS a "from" and "to" to transition between.
    requestAnimationFrame(function () {
      setVisible(true)
    })

    // After 2 seconds, navigate to /login
    const timer = setTimeout(function () {
      router.push('/login')
    }, 2000)

    // Cleanup: if the component unmounts before 2s (user navigates away
    // manually), cancel the timer so we don't get a ghost redirect
    return function () {
      clearTimeout(timer)
    }

  }, [router])
  // ↑ dependency array: [router] because we use router.push inside.
  // In practice router is stable and this effect runs once on mount.

  return (
    <div
      className={
        'min-h-screen bg-black flex flex-col items-center justify-center transition-opacity duration-700 '
        + (visible ? 'opacity-100' : 'opacity-0')
      }
    >
      {/* The logo — large, heavy weight, tight tracking like X's logo */}
      <h1 className="text-white text-8xl font-black tracking-tighter">
        RB
      </h1>

      {/* Platform name — smaller, lighter weight, spaced out from the logo */}
      <p className="text-zinc-300 text-xl font-light tracking-widest mt-3">
        ResearchBD
      </p>

      {/* Tagline — muted, smallest, gives the mission in one line */}
      <p className="text-zinc-500 text-sm mt-2">
        Let&apos;s change our nation.
      </p>
    </div>
  )
}
