'use client'

import { createContext, useContext, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
type Field = {
  id: string
  name: string
  subfields: { id: string; name: string }[]
}

export type ActiveFilters = {
  fieldId: string | null
  subfieldId: string | null
  urgency: string | null
  country: string | null
}

type FilterContextValue = {
  // Filter options (static, from DB)
  fields: Field[]
  countries: string[]
  // Active filter state (changes when user applies filters)
  filters: ActiveFilters
  setFilters: (filters: ActiveFilters) => void
  // Overlay visibility
  showOverlay: boolean
  setShowOverlay: (show: boolean) => void
}

// ── Context ───────────────────────────────────────────────────
const FilterDataContext = createContext<FilterContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────
export function FilterDataProvider({
  children,
  fields,
  countries,
}: {
  children: React.ReactNode
  fields: Field[]
  countries: string[]
}) {
  const [filters, setFilters] = useState<ActiveFilters>({
    fieldId: null,
    subfieldId: null,
    urgency: null,
    country: null,
  })
  const [showOverlay, setShowOverlay] = useState(false)

  return (
    <FilterDataContext.Provider value={{
      fields,
      countries,
      filters,
      setFilters,
      showOverlay,
      setShowOverlay,
    }}>
      {children}
    </FilterDataContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────
export function useFilterData() {
  const context = useContext(FilterDataContext)
  if (!context) {
    throw new Error('useFilterData must be used inside FilterDataProvider')
  }
  return context
}