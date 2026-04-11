'use client'

import { useState } from 'react'
import CollaborationForm from './CollaborationForm'
import HelpForm from './HelpForm'
import FinishedWorkForm from './FinishedWorkForm'
import FundingForm from './FundingForm'

// ── Types ────────────────────────────────────────────────────
type PostTypeOption = {
  type: string
  label: string
  description: string
  icon: string
}

const RESEARCHER_OPTIONS: PostTypeOption[] = [
  {
    type: 'collaboration',
    label: 'Collaboration',
    description: 'Find researchers to work with',
    icon: '🤝',
  },
  {
    type: 'help',
    label: 'Help',
    description: 'Get help with your research',
    icon: '🆘',
  },
  {
    type: 'finished_work',
    label: 'Finished Work',
    description: 'Share your completed research',
    icon: '📄',
  },
]

const FUNDING_OPTIONS: PostTypeOption[] = [
  {
    type: 'funding_opportunity',
    label: 'Funding Opportunity',
    description: 'Post a funding opportunity for researchers',
    icon: '💰',
  },
]

// ── Props ────────────────────────────────────────────────────
type CreatePostButtonProps = {
  accountType: string
  variant: 'mobile' | 'sidebar'
}

// ── Component ────────────────────────────────────────────────
export default function CreatePostButton({ accountType, variant }: CreatePostButtonProps) {

  const [showPicker, setShowPicker] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const options = accountType === 'funding_agency' ? FUNDING_OPTIONS : RESEARCHER_OPTIONS

  function handleTypePick(type: string) {
    setShowPicker(false)
    setSelectedType(type)
  }

  function handleClose() {
    setSelectedType(null)
  }

  return (
    <>
      {/* ── Trigger Button ─────────────────────────────────── */}
      {variant === 'mobile' ? (
        <button
          onClick={function() { setShowPicker(true) }}
          className="fixed bottom-20 right-5 bg-white text-black font-bold w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg md:hidden z-50"
        >
          +
        </button>
      ) : (
        <button
          onClick={function() { setShowPicker(true) }}
          className="w-full bg-white text-black font-bold py-3 rounded-full text-center text-lg hover:bg-zinc-200 transition-colors mb-2"
        >
          + Post
        </button>
      )}

      {/* ── Bottom Sheet (Type Picker) ─────────────────────── */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={function() { setShowPicker(false) }}
        >
          <div className="absolute inset-0 bg-black/70" />

          <div
            className="relative w-full max-w-lg bg-zinc-900 rounded-t-2xl border-t border-zinc-700 p-6 pb-10 animate-slide-up"
            onClick={function(e) { e.stopPropagation() }}
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-6" />

            <h2 className="text-white text-lg font-bold mb-4">What do you want to post?</h2>

            <div className="flex flex-col gap-3">
              {options.map(function(option) {
                return (
                  <button
                    key={option.type}
                    onClick={function() { handleTypePick(option.type) }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600 transition-colors text-left"
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{option.label}</p>
                      <p className="text-zinc-400 text-sm">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Form Overlays ──────────────────────────────────── */}
      {/* Only ONE of these renders at a time — whichever matches selectedType.
          Each form renders its own full-screen overlay and calls handleClose
          when done (submit success or ✕ click). */}
      {selectedType === 'collaboration' && <CollaborationForm onClose={handleClose} />}
      {selectedType === 'help' && <HelpForm onClose={handleClose} />}
      {selectedType === 'finished_work' && <FinishedWorkForm onClose={handleClose} />}
      {selectedType === 'funding_opportunity' && <FundingForm onClose={handleClose} />}
    </>
  )
}
