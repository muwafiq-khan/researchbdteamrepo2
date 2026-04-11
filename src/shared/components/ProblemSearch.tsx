'use client'

import { useState, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────
// Minimal shape of a problem — just what we need for display + selection
type ProblemResult = {
  id: string
  title: string
  urgencyLevel: string
}

type ProblemSearchProps = {
  // The currently selected problem (null if none picked yet)
  selectedProblem: ProblemResult | null
  // Callback when user picks a problem from the dropdown
  onSelect: (problem: ProblemResult | null) => void
}

// ── Component ────────────────────────────────────────────────
export default function ProblemSearch({ selectedProblem, onSelect }: ProblemSearchProps) {

  // What the user has typed into the search box
  const [query, setQuery] = useState('')

  // Array of problems returned by the API
  const [results, setResults] = useState<ProblemResult[]>([])

  // True while waiting for API response
  const [isSearching, setIsSearching] = useState(false)

  // ── Debounced search ────────────────────────────────────────
  // Fires every time `query` changes, but waits 300ms before
  // actually calling the API. If user types another character
  // within 300ms, the old timer is cancelled (cleanup function)
  // and a new one starts. Net effect: API only fires when user
  // pauses typing.
  useEffect(function() {

    // Nothing to search — clear results and bail
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    // Start a 300ms timer. If this effect re-runs before 300ms
    // (user typed another letter), the cleanup below cancels this
    // timer and a fresh one starts.
    const timer = setTimeout(function() {
      fetch('/api/problems/search?q=' + encodeURIComponent(query.trim()))
        .then(function(res) { return res.json() })
        .then(function(data) {
          setResults(data.problems)
          setIsSearching(false)
        })
        .catch(function() {
          setResults([])
          setIsSearching(false)
        })
    }, 300)

    // Cleanup: cancel the timer if query changes before 300ms
    return function() {
      clearTimeout(timer)
    }

  }, [query])

  // ── If a problem is already selected, show it as a chip ─────
  if (selectedProblem) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {selectedProblem.title}
          </p>
          <p className="text-zinc-400 text-xs">
            {selectedProblem.urgencyLevel}
          </p>
        </div>
        {/* ✕ button clears the selection — passes null back to parent */}
        <button
          type="button"
          onClick={function() { onSelect(null) }}
          className="text-zinc-400 hover:text-white text-lg shrink-0"
        >
          ✕
        </button>
      </div>
    )
  }

  // ── Search input + dropdown ─────────────────────────────────
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={function(e) { setQuery(e.target.value) }}
        placeholder="Search problems to link..."
        className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
      />

      {/* Searching indicator */}
      {isSearching && (
        <p className="text-zinc-500 text-xs mt-1 px-1">Searching...</p>
      )}

      {/* Dropdown — only shows when there are results and user hasn't picked one */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-48 overflow-y-auto z-10">
          {results.map(function(problem) {
            return (
              <button
                key={problem.id}
                type="button"
                onClick={function() {
                  // User picked this problem — tell parent, clear search
                  onSelect(problem)
                  setQuery('')
                  setResults([])
                }}
                className="w-full text-left p-3 hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-b-0"
              >
                <p className="text-white text-sm font-medium">{problem.title}</p>
                <p className="text-zinc-400 text-xs">{problem.urgencyLevel}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
