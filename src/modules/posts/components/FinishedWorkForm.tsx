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

type FinishedWorkFormProps = {
  onClose: () => void
}

export default function FinishedWorkForm({ onClose }: FinishedWorkFormProps) {

  const router = useRouter()

  // ── Form field states ───────────────────────────────────────
  const [title, setTitle] = useState('')
  const [methodology, setMethodology] = useState('')
  const [keyFindings, setKeyFindings] = useState('')
  const [futureScope, setFutureScope] = useState('')
  const [paperUrl, setPaperUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [journalName, setJournalName] = useState('')
  const [publicationDate, setPublicationDate] = useState('')
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
        postType: 'finished_work',
        title: title,
        visibility: visibility,
        problemId: linkedProblem?.id ?? null,
        methodology: methodology,
        keyFindings: keyFindings,
        futureScope: futureScope || null,
        paperUrl: paperUrl || null,
        githubUrl: githubUrl || null,
        journalName: journalName || null,
        publicationDate: publicationDate || null,
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
          <h2 className="text-white text-lg font-bold">Share Finished Work</h2>
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
              placeholder="Title of your research work"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Methodology — how the research was conducted */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Methodology *</label>
            <textarea
              value={methodology}
              onChange={function(e) { setMethodology(e.target.value) }}
              placeholder="How was the research conducted?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Key Findings — the results */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Key Findings *</label>
            <textarea
              value={keyFindings}
              onChange={function(e) { setKeyFindings(e.target.value) }}
              placeholder="What did you discover?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Future Scope</label>
            <textarea
              value={futureScope}
              onChange={function(e) { setFutureScope(e.target.value) }}
              placeholder="What are the next steps or open questions?"
              rows={2}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Links row — paper and github side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Paper URL</label>
              <input
                type="url"
                value={paperUrl}
                onChange={function(e) { setPaperUrl(e.target.value) }}
                placeholder="https://..."
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={function(e) { setGithubUrl(e.target.value) }}
                placeholder="https://..."
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Journal info row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Journal Name</label>
              <input
                type="text"
                value={journalName}
                onChange={function(e) { setJournalName(e.target.value) }}
                placeholder="e.g. Nature, IEEE"
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Publication Date</label>
              <input
                type="date"
                value={publicationDate}
                onChange={function(e) { setPublicationDate(e.target.value) }}
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
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
