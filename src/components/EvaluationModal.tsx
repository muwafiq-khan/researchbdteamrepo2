"use client"

import { useState, useEffect } from 'react'

type EvaluationModalProps = {
  isOpen: boolean
  onClose: () => void
  evaluateeId: string
  evaluateeName: string
}

export default function EvaluationModal({ isOpen, onClose, evaluateeId, evaluateeName }: EvaluationModalProps) {
  const [punctuality, setPunctuality] = useState(0)
  const [dedication, setDedication] = useState(0)
  const [collaboration, setCollaboration] = useState(0)
  const [integrity, setIntegrity] = useState(0)
  const [analytical, setAnalytical] = useState(0)
  const [inquisitiveness, setInquisitiveness] = useState(0)
  const [adaptability, setAdaptability] = useState(0)
  const [responsiveness, setResponsiveness] = useState(0)
  const [openMindedness, setOpenMindedness] = useState(0)
  
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch existing evaluation if any
  useEffect(() => {
    if (isOpen && evaluateeId) {
      const fetchEvaluation = async () => {
        setIsLoading(true)
        setError('')
        try {
          const res = await fetch(`/api/evaluations/${evaluateeId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.evaluation) {
              setPunctuality(data.evaluation.punctualityScore)
              setDedication(data.evaluation.dedicationScore)
              setCollaboration(data.evaluation.collaborationScore)
              setIntegrity(data.evaluation.integrityScore || 0)
              setAnalytical(data.evaluation.analyticalScore || 0)
              setInquisitiveness(data.evaluation.inquisitivenessScore || 0)
              setAdaptability(data.evaluation.adaptabilityScore || 0)
              setResponsiveness(data.evaluation.responsivenessScore || 0)
              setOpenMindedness(data.evaluation.openMindednessScore || 0)
              setFeedback(data.evaluation.feedback || '')
            } else {
              // reset to default if no evaluation exists
              setPunctuality(0)
              setDedication(0)
              setCollaboration(0)
              setIntegrity(0)
              setAnalytical(0)
              setInquisitiveness(0)
              setAdaptability(0)
              setResponsiveness(0)
              setOpenMindedness(0)
              setFeedback('')
            }
          }
        } catch (err) {
          console.error("Failed to fetch evaluation", err)
        } finally {
          setIsLoading(false)
        }
      }
      fetchEvaluation()
      setSuccess(false) // reset success state when opening
    }
  }, [isOpen, evaluateeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      punctuality === 0 || 
      dedication === 0 || 
      collaboration === 0 || 
      integrity === 0 || 
      analytical === 0 || 
      inquisitiveness === 0 || 
      adaptability === 0 || 
      responsiveness === 0 || 
      openMindedness === 0
    ) {
      setError('Please provide a score for all attributes.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluateeId,
          punctualityScore: punctuality,
          dedicationScore: dedication,
          collaborationScore: collaboration,
          integrityScore: integrity,
          analyticalScore: analytical,
          inquisitivenessScore: inquisitiveness,
          adaptabilityScore: adaptability,
          responsivenessScore: responsiveness,
          openMindednessScore: openMindedness,
          feedback
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit evaluation')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Helper for star rating
  const renderStars = (currentValue: number, setValue: (val: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            className={`text-2xl focus:outline-none transition-colors ${star <= currentValue ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400/50'}`}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 py-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-full flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 shrink-0">Evaluate Researcher</h2>
        <p className="text-zinc-400 mb-6 text-sm shrink-0">
          Rate your experience working with <span className="font-semibold text-white">{evaluateeName}</span>.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8 flex-1">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : success ? (
          <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-xl text-center mb-4 font-medium flex-1">
            Evaluation submitted successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm shrink-0">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Punctuality</label>
                <p className="text-zinc-500 text-xs mb-2">How timely were they with their deliverables?</p>
                {renderStars(punctuality, setPunctuality)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Work Dedication</label>
                <p className="text-zinc-500 text-xs mb-2">How committed were they to the research goals?</p>
                {renderStars(dedication, setDedication)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Collaboration</label>
                <p className="text-zinc-500 text-xs mb-2">How well did they communicate and work with the team?</p>
                {renderStars(collaboration, setCollaboration)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Integrity</label>
                <p className="text-zinc-500 text-xs mb-2">Did they maintain high ethical standards in their work?</p>
                {renderStars(integrity, setIntegrity)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Analytical Thinking</label>
                <p className="text-zinc-500 text-xs mb-2">How strong were their problem-solving and analytical skills?</p>
                {renderStars(analytical, setAnalytical)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Inquisitiveness</label>
                <p className="text-zinc-500 text-xs mb-2">Did they show curiosity and eagerness to explore new ideas?</p>
                {renderStars(inquisitiveness, setInquisitiveness)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Adaptability</label>
                <p className="text-zinc-500 text-xs mb-2">How well did they handle changes or unexpected challenges?</p>
                {renderStars(adaptability, setAdaptability)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Responsiveness</label>
                <p className="text-zinc-500 text-xs mb-2">How quickly did they reply to messages or requests?</p>
                {renderStars(responsiveness, setResponsiveness)}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-sm">Open-mindedness</label>
                <p className="text-zinc-500 text-xs mb-2">Were they receptive to feedback and different perspectives?</p>
                {renderStars(openMindedness, setOpenMindedness)}
              </div>
            </div>

            <div className="mt-2 shrink-0">
              <label className="block text-zinc-300 font-medium mb-2 text-sm">Feedback (Optional)</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Leave some constructive feedback..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4 shrink-0 pt-4 border-t border-zinc-800">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
