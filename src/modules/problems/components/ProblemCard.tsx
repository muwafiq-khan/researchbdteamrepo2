'use client'

// Presentational component — no state, no effects.
// 'use client' only because its parent (ProblemFeed) is a Client Component.
// A Client Component can only render other Client Components.

import Link from 'next/link'

type ProblemCardProps = {
  problem: {
    id: string
    title: string
    description: string
    urgencyLevel: string
    country: string | null
    thumbnailUrl: string | null
    subfield: {
      name: string
      field: {
        name: string
      }
    }
  }
}

function getUrgencyColor(level: string) {
  if (level === 'critical') return 'bg-red-500'
  if (level === 'moderate') return 'bg-yellow-500'
  return 'bg-green-500'
}

function getUrgencyLabel(level: string) {
  if (level === 'critical') return 'Critical'
  if (level === 'moderate') return 'Moderate'
  return 'Exploratory'
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block px-4 py-5 hover:bg-zinc-950 transition-colors border-b border-zinc-800"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getUrgencyColor(problem.urgencyLevel)}`} />
        <span className="text-xs font-medium text-zinc-400">{getUrgencyLabel(problem.urgencyLevel)}</span>
        <span className="text-zinc-600 text-xs">·</span>
        <span className="text-xs text-zinc-400">{problem.subfield.field.name}</span>
        <span className="text-zinc-600 text-xs">·</span>
        <span className="text-xs text-zinc-400">{problem.subfield.name}</span>
        {problem.country && (
          <>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-xs text-zinc-400">{problem.country}</span>
          </>
        )}
      </div>

      <h2 className="text-white font-bold text-lg leading-snug mb-2">
        {problem.title}
      </h2>

      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-4">
        {problem.description}
      </p>

      {problem.thumbnailUrl && (
        <img
          src={problem.thumbnailUrl}
          alt={problem.title}
          className="w-full h-56 object-cover rounded-xl"
        />
      )}
    </Link>
  )
}