'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useFilterData } from '../../../shared/providers/FilterDataProvider'
import type { ActiveFilters } from '../../../shared/providers/FilterDataProvider'
import ProblemCard from './ProblemCard'

type Problem = {
  id: string
  title: string
  description: string
  urgencyLevel: string
  country: string | null
  thumbnailUrl: string | null
  subfield: {
    name: string
    field: {
      name: string
    }
  }
}

type ProblemFeedProps = {
  initialProblems: Problem[]
}

const PAGE_SIZE = 10

export default function ProblemFeed({ initialProblems }: ProblemFeedProps) {

  const { filters } = useFilterData()

  const [problems, setProblems] = useState<Problem[]>(initialProblems)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialProblems.length >= PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  function buildQueryString(pageNum: number, activeFilters: ActiveFilters) {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(PAGE_SIZE))
    if (activeFilters.fieldId) params.set('fieldId', activeFilters.fieldId)
    if (activeFilters.subfieldId) params.set('subfieldId', activeFilters.subfieldId)
    if (activeFilters.urgency) params.set('urgency', activeFilters.urgency)
    if (activeFilters.country) params.set('country', activeFilters.country)
    return params.toString()
  }

  const fetchProblems = useCallback(async function(pageNum: number, activeFilters: ActiveFilters, replace: boolean) {
    setIsLoading(true)
    try {
      const query = buildQueryString(pageNum, activeFilters)
      const response = await fetch(`/api/problems?${query}`)
      const data = await response.json()

      if (replace) {
        setProblems(data.problems)
      } else {
        setProblems(function(prev) { return [...prev, ...data.problems] })
      }

      setHasMore(data.problems.length >= PAGE_SIZE)
    } catch (error) {
      console.error('Failed to fetch problems:', error)
    }
    setIsLoading(false)
  }, [])

  // ── When filters change, reset and fetch page 1 ─────────────
  useEffect(function() {
    setPage(1)
    fetchProblems(1, filters, true)
  }, [filters, fetchProblems])

  // ── Infinite scroll ─────────────────────────────────────────
  useEffect(function() {
    if (!sentinelRef.current) return
    if (!hasMore) return

    const observer = new IntersectionObserver(
      function(entries) {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchProblems(nextPage, filters, false)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.current)
    return function() { observer.disconnect() }
  }, [page, hasMore, isLoading, filters, fetchProblems])

  return (
    <div>
      {problems.length === 0 && !isLoading && (
        <div className="px-4 py-12 text-center text-zinc-500 text-sm">
          No problems match your filters.
        </div>
      )}

      {problems.map(function(problem) {
        return <ProblemCard key={problem.id} problem={problem} />
      })}

      {isLoading && (
        <div className="px-4 py-6 text-center text-zinc-500 text-sm">
          Loading...
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  )
}