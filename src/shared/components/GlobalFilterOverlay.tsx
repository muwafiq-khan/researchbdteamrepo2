'use client'

import { useFilterData } from '../providers/FilterDataProvider'
import ProblemFilterOverlay from '../../modules/problems/components/ProblemFilterOverlay'

export default function GlobalFilterOverlay() {
  const { showOverlay, setShowOverlay, filters, setFilters } = useFilterData()

  if (!showOverlay) return null

  return (
    <ProblemFilterOverlay
      filters={filters}
      onApply={function(newFilters) {
        setFilters(newFilters)
        setShowOverlay(false)
      }}
      onClose={function() { setShowOverlay(false) }}
    />
  )
}