'use client'

import { useFilterData } from '../providers/FilterDataProvider'

export default function FilterIconButton() {
  const { filters, setShowOverlay } = useFilterData()

  const hasActiveFilters = filters.fieldId || filters.subfieldId || filters.urgency || filters.country

  return (
    <button
      onClick={function() { setShowOverlay(true) }}
      className="relative w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 flex items-center justify-center transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4 text-zinc-300"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
        />
      </svg>
      {hasActiveFilters && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full" />
      )}
    </button>
  )
}