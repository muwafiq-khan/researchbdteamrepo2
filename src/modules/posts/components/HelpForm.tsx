'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProblemSearch from '../../../shared/components/ProblemSearch'
import VisibilityToggle from '../../../shared/components/VisibilityToggle'

type ProblemResult = {
  id: string
  title: string
  urgencyLevel: string
}

type HelpFormProps = {
  onClose: () => void
}

export default function HelpForm({ onClose }: HelpFormProps) {

  const router = useRouter()

  // ── Form field states ───────────────────────────────────────
  const [title, setTitle] = useState('')
  const [problemSpecification, setProblemSpecification] = useState('')
  const [whereStuck, setWhereStuck] = useState('')
  const [whatTried, setWhatTried] = useState('')
  const [minQualificationScore, setMinQualificationScore] = useState('')
  const [freeExpression, setFreeExpression] = useState('')

  // ── Shared fields ───────────────────────────────────────────
  const [linkedProblem, setLinkedProblem] = useState<ProblemResult | null>(null)
  const [visibility, setVisibility] = useState('public')

  // ── Submission state ────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postType: 'help',
        title: title,
        visibility: visibility,
        problemId: linkedProblem?.id ?? null,
        problemSpecification: problemSpecification,
        whereStuck: whereStuck,
        whatTried: whatTried,
        minQualificationScore: minQualificationScore ? parseFloat(minQualificationScore) : 0,
        freeExpression: freeExpression || null,
      }),
    })
      .then(function(res) {
        if (!res.ok) {
          return res.json().then(function(data) {
            throw new Error(data.error || 'Something went wrong')
          })
        }
        return res.json()
      })
      .then(function() {
        router.refresh()
        onClose()
      })
      .catch(function(err) {
        setError(err.message)
        setIsSubmitting(false)
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-700">

        <div className="flex items-center justify-between p-4 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-white text-lg font-bold">Ask for Help</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          {error && (
            <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={function(e) { setTitle(e.target.value) }}
              placeholder="Summarize what you need help with"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Problem Specification — what exactly is the problem */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Problem Specification *</label>
            <textarea
              value={problemSpecification}
              onChange={function(e) { setProblemSpecification(e.target.value) }}
              placeholder="Describe the problem in detail"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Where Stuck — the specific blocker */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Where Are You Stuck? *</label>
            <textarea
              value={whereStuck}
              onChange={function(e) { setWhereStuck(e.target.value) }}
              placeholder="What specific part is blocking you?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* What Tried — so helpers don't suggest the same things */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">What Have You Tried? *</label>
            <textarea
              value={whatTried}
              onChange={function(e) { setWhatTried(e.target.value) }}
              placeholder="What approaches have you already attempted?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Min Qualification Score — gatekeeping for quality responses */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Minimum Qualification Score</label>
            <input
              type="number"
              value={minQualificationScore}
              onChange={function(e) { setMinQualificationScore(e.target.value) }}
              placeholder="0 = anyone can respond (default)"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Anything Else?</label>
            <textarea
              value={freeExpression}
              onChange={function(e) { setFreeExpression(e.target.value) }}
              placeholder="Additional context..."
              rows={2}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Link to Problem</label>
            <ProblemSearch selectedProblem={linkedProblem} onSelect={setLinkedProblem} />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Visibility</label>
            <VisibilityToggle value={visibility} onChange={setVisibility} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>

        </div>
      </div>
    </div>
  )
}
