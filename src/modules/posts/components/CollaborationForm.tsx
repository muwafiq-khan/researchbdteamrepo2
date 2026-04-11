'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProblemSearch from '../../../shared/components/ProblemSearch'
import VisibilityToggle from '../../../shared/components/VisibilityToggle'

// ── Types ────────────────────────────────────────────────────
type ProblemResult = {
  id: string
  title: string
  urgencyLevel: string
}

type CollaborationFormProps = {
  onClose: () => void
}

// ── Academic level options for the dropdown ───────────────────
// Must match the AcademicLevel enum in your Prisma schema exactly
const ACADEMIC_LEVELS = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'phd', label: 'PhD' },
  { value: 'professor', label: 'Professor' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'industry', label: 'Industry' },
]

// ── Component ────────────────────────────────────────────────
export default function CollaborationForm({ onClose }: CollaborationFormProps) {

  const router = useRouter()

  // ── Form field states ───────────────────────────────────────
  // Each field maps to a column in the posts or collaboration_posts table
  const [title, setTitle] = useState('')
  const [problemStatement, setProblemStatement] = useState('')
  const [domainDescription, setDomainDescription] = useState('')
  const [proposedApproach, setProposedApproach] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')
  const [researchLevel, setResearchLevel] = useState('undergraduate')
  const [requiredExpertise, setRequiredExpertise] = useState('')
  const [timeline, setTimeline] = useState('')
  const [maxCollaborators, setMaxCollaborators] = useState('')
  const [freeExpression, setFreeExpression] = useState('')

  // ── Shared fields (every form has these) ────────────────────
  const [linkedProblem, setLinkedProblem] = useState<ProblemResult | null>(null)
  const [visibility, setVisibility] = useState('public')

  // ── Submission state ────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ── Submit handler ──────────────────────────────────────────
  function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postType: 'collaboration',
        title: title,
        visibility: visibility,
        problemId: linkedProblem?.id ?? null,
        // Extension table fields — the API route will separate these
        // from the base post fields and create both rows in a transaction
        problemStatement: problemStatement,
        domainDescription: domainDescription,
        proposedApproach: proposedApproach,
        expectedOutcome: expectedOutcome,
        researchLevel: researchLevel,
        requiredExpertise: requiredExpertise,
        timeline: timeline || null,
        maxCollaborators: maxCollaborators ? parseInt(maxCollaborators) : null,
        freeExpression: freeExpression || null,
      }),
    })
      .then(function(res) {
        if (!res.ok) {
          // Server returned an error — extract the message
          return res.json().then(function(data) {
            throw new Error(data.error || 'Something went wrong')
          })
        }
        return res.json()
      })
      .then(function() {
        // Success — refresh server data so feed shows the new post,
        // then close the form overlay
        router.refresh()
        onClose()
      })
      .catch(function(err) {
        setError(err.message)
        setIsSubmitting(false)
      })
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-700">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-white text-lg font-bold">Create Collaboration Post</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          {/* Error banner — only renders when error state is non-empty */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Title — required, goes into posts table */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={function(e) { setTitle(e.target.value) }}
              placeholder="What's your research about?"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Problem Statement — required, goes into collaboration_posts table */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Problem Statement *</label>
            <textarea
              value={problemStatement}
              onChange={function(e) { setProblemStatement(e.target.value) }}
              placeholder="What research problem are you trying to solve?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Domain Description — required */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Domain Description *</label>
            <textarea
              value={domainDescription}
              onChange={function(e) { setDomainDescription(e.target.value) }}
              placeholder="Which research domain does this belong to?"
              rows={2}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Proposed Approach — required */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Proposed Approach *</label>
            <textarea
              value={proposedApproach}
              onChange={function(e) { setProposedApproach(e.target.value) }}
              placeholder="How do you plan to tackle this?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Expected Outcome — required */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Expected Outcome *</label>
            <textarea
              value={expectedOutcome}
              onChange={function(e) { setExpectedOutcome(e.target.value) }}
              placeholder="What results do you hope to achieve?"
              rows={2}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Research Level — required, dropdown */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Research Level Needed *</label>
            <select
              value={researchLevel}
              onChange={function(e) { setResearchLevel(e.target.value) }}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
            >
              {ACADEMIC_LEVELS.map(function(level) {
                return (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Required Expertise — required */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Required Expertise *</label>
            <input
              type="text"
              value={requiredExpertise}
              onChange={function(e) { setRequiredExpertise(e.target.value) }}
              placeholder="e.g. Machine Learning, NLP, Statistics"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Timeline — optional */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Timeline</label>
            <input
              type="text"
              value={timeline}
              onChange={function(e) { setTimeline(e.target.value) }}
              placeholder="e.g. 3 months, Summer 2026"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Max Collaborators — optional */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Max Collaborators</label>
            <input
              type="number"
              value={maxCollaborators}
              onChange={function(e) { setMaxCollaborators(e.target.value) }}
              placeholder="e.g. 5"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Free Expression — optional */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Anything Else?</label>
            <textarea
              value={freeExpression}
              onChange={function(e) { setFreeExpression(e.target.value) }}
              placeholder="Additional thoughts, context, or requirements..."
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Problem Search — optional, links post to a Problem Dashboard page */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Link to Problem</label>
            <ProblemSearch
              selectedProblem={linkedProblem}
              onSelect={setLinkedProblem}
            />
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Visibility</label>
            <VisibilityToggle
              value={visibility}
              onChange={setVisibility}
            />
          </div>

          {/* Submit */}
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
