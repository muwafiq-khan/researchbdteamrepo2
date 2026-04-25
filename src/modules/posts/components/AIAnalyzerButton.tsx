'use client'

import { useState } from 'react'

type Analysis = {
  compatibility: 'High' | 'Medium' | 'Low'
  summary: string
  pros: string[]
  cons: string[]
  risks: string[]
}

type AIAnalyzerButtonProps = {
  targetUserId: string
  targetUserName: string
}

// Badge color based on compatibility level
const compatibilityStyle: Record<string, string> = {
  High:   'bg-green-900 text-green-300 border border-green-700',
  Medium: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
  Low:    'bg-red-900 text-red-300 border border-red-700',
}

export default function AIAnalyzerButton({ targetUserId, targetUserName }: AIAnalyzerButtonProps) {
  const [isOpen, setIsOpen]       = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis]   = useState<Analysis | null>(null)
  const [error, setError]         = useState('')

  async function handleOpen() {
    setIsOpen(true)

    // If we already have the result, just show the modal again
    if (analysis) return

    setIsLoading(true)
    setError('')

    try {
      const res  = await fetch(`/api/collab-analyze?targetId=${targetUserId}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Analysis failed. Please try again.')
        return
      }

      setAnalysis(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border border-zinc-700 text-zinc-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
      >
        🤖 AI Analyze
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={handleClose}
        >
          {/* Modal card — stop click from closing when clicking inside */}
          <div
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">Collaboration Analysis</h2>
                <p className="text-zinc-400 text-sm mt-0.5">You × {targetUserName}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-zinc-500 hover:text-white text-xl leading-none ml-4"
              >
                ✕
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Analyzing records of deeds...</p>
              </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
              <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Result */}
            {!isLoading && !error && analysis && (
              <div className="flex flex-col gap-5">
                {/* Compatibility badge */}
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm">Compatibility:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${compatibilityStyle[analysis.compatibility] ?? compatibilityStyle['Medium']}`}>
                    {analysis.compatibility}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-zinc-300 text-sm leading-relaxed border-l-2 border-zinc-600 pl-3">
                  {analysis.summary}
                </p>

                {/* Pros */}
                {analysis.pros?.length > 0 && (
                  <div>
                    <h3 className="text-green-400 font-semibold text-sm mb-2">✅ Pros</h3>
                    <ul className="flex flex-col gap-1.5">
                      {analysis.pros.map((item, i) => (
                        <li key={i} className="text-zinc-300 text-sm flex gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cons */}
                {analysis.cons?.length > 0 && (
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-sm mb-2">⚠️ Cons</h3>
                    <ul className="flex flex-col gap-1.5">
                      {analysis.cons.map((item, i) => (
                        <li key={i} className="text-zinc-300 text-sm flex gap-2">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {analysis.risks?.length > 0 && (
                  <div>
                    <h3 className="text-red-400 font-semibold text-sm mb-2">🚨 Risks</h3>
                    <ul className="flex flex-col gap-1.5">
                      {analysis.risks.map((item, i) => (
                        <li key={i} className="text-zinc-300 text-sm flex gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Re-analyze */}
                <button
                  onClick={() => { setAnalysis(null); setIsLoading(true); handleOpen() }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline self-end transition-colors"
                >
                  Re-analyze
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
