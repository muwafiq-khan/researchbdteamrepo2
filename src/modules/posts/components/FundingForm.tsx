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

type FundingFormProps = {
  onClose: () => void
}

export default function FundingForm({ onClose }: FundingFormProps) {

  const router = useRouter()

  // ── Form field states ───────────────────────────────────────
  const [title, setTitle] = useState('')
  const [fundingAmountMin, setFundingAmountMin] = useState('')
  const [fundingAmountMax, setFundingAmountMax] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [contactInfo, setContactInfo] = useState('')

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
        postType: 'funding_opportunity',
        title: title,
        visibility: visibility,
        problemId: linkedProblem?.id ?? null,
        fundingAmountMin: fundingAmountMin ? parseFloat(fundingAmountMin) : null,
        fundingAmountMax: fundingAmountMax ? parseFloat(fundingAmountMax) : null,
        deliverables: deliverables || null,
        contactInfo: contactInfo,
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
          <h2 className="text-white text-lg font-bold">Post Funding Opportunity</h2>
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
              placeholder="Name of the funding opportunity"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Funding range — min and max side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Min Amount (BDT)</label>
              <input
                type="number"
                value={fundingAmountMin}
                onChange={function(e) { setFundingAmountMin(e.target.value) }}
                placeholder="e.g. 50000"
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Max Amount (BDT)</label>
              <input
                type="number"
                value={fundingAmountMax}
                onChange={function(e) { setFundingAmountMax(e.target.value) }}
                placeholder="e.g. 500000"
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Deliverables</label>
            <textarea
              value={deliverables}
              onChange={function(e) { setDeliverables(e.target.value) }}
              placeholder="What do you expect from the funded researchers?"
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Contact Info — required for funding posts */}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Contact Information *</label>
            <input
              type="text"
              value={contactInfo}
              onChange={function(e) { setContactInfo(e.target.value) }}
              placeholder="Email, phone, or website"
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
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
