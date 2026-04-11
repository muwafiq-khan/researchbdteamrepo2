'use client'

// ── Types ────────────────────────────────────────────────────
type VisibilityOption = {
  value: string
  label: string
}

const OPTIONS: VisibilityOption[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends_only', label: 'Friends Only' },
  { value: 'university_only', label: 'University Only' },
]

type VisibilityToggleProps = {
  // The currently selected visibility value
  value: string
  // Callback when user picks a different option
  onChange: (value: string) => void
}

// ── Component ────────────────────────────────────────────────
// Fully controlled — no internal state. Parent passes `value`,
// this component just renders the UI and calls `onChange` on click.
export default function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(function(option) {
        // Is this the currently active option?
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={function() { onChange(option.value) }}
            className={
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors '
              + (isActive
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-750')
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
