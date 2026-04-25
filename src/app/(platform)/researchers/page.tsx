'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useFilterData } from '@/shared/providers/FilterDataProvider'

// ── Types ─────────────────────────────────────────────────────

type Qualification = {
  hIndex: number
  citationCount: number
  publicationCount: number
  qualificationScore: number
  starScore: number
}

type ResearcherUser = {
  id: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
  researcher: {
    academicLevel: string | null
    institution: string | null
    bio: string | null
    skills: string[]
    researchFields: { field: { id: string; name: string } }[]
    qualification: Qualification | null
  } | null
}

type FiltersState = {
  search: string
  fieldId: string
  academicLevel: string
  minCitations: string
  minHIndex: string
  sortBy: string
}

const ACADEMIC_LEVEL_LABELS: Record<string, string> = {
  undergraduate: 'Undergraduate',
  postgraduate:  'Postgraduate',
  phd:           'PhD',
  professor:     'Professor',
  researcher:    'Researcher',
  industry:      'Industry',
}

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest' },
  { value: 'citations', label: 'Most Citations' },
  { value: 'hIndex',    label: 'Highest H-Index' },
  { value: 'qualScore', label: 'Qualification Score' },
  { value: 'pubs',      label: 'Most Publications' },
]

// ── Researcher Card ───────────────────────────────────────────

function ResearcherCard({ user }: { user: ResearcherUser }) {
  const r = user.researcher
  const q = r?.qualification

  return (
    <Link
      href={`/profile/${user.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            width={48}
            height={48}
            className="rounded-full object-cover w-12 h-12 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
          {r?.academicLevel && (
            <p className="text-zinc-400 text-xs mt-0.5">
              {ACADEMIC_LEVEL_LABELS[r.academicLevel] ?? r.academicLevel}
            </p>
          )}
          {r?.institution && (
            <p className="text-zinc-500 text-xs truncate">{r.institution}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {r?.bio && (
        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-3">{r.bio}</p>
      )}

      {/* Fields */}
      {r && r.researchFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {r.researchFields.slice(0, 3).map(({ field }) => (
            <span
              key={field.id}
              className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full"
            >
              {field.name}
            </span>
          ))}
          {r.researchFields.length > 3 && (
            <span className="text-[11px] text-zinc-500">
              +{r.researchFields.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Metrics */}
      {q && (
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 mt-auto">
          <div className="text-center">
            <p className="text-white text-sm font-bold">{q.citationCount}</p>
            <p className="text-zinc-500 text-[10px]">Citations</p>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-bold">{q.hIndex}</p>
            <p className="text-zinc-500 text-[10px]">H-Index</p>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-bold">{q.publicationCount}</p>
            <p className="text-zinc-500 text-[10px]">Publications</p>
          </div>
        </div>
      )}
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function ResearchersPage() {
  const { fields } = useFilterData()

  const [filters, setFilters] = useState<FiltersState>({
    search:       '',
    fieldId:      '',
    academicLevel: '',
    minCitations: '',
    minHIndex:    '',
    sortBy:       'newest',
  })
  const [pendingSearch, setPendingSearch] = useState('')

  const [researchers, setResearchers] = useState<ResearcherUser[]>([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [page, setPage]               = useState(1)
  const [isLoading, setIsLoading]     = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchResearchers = useCallback(async (f: FiltersState, p: number, append = false) => {
    if (append) setIsLoadingMore(true)
    else setIsLoading(true)

    const params = new URLSearchParams()
    if (f.search)        params.set('search', f.search)
    if (f.fieldId)       params.set('fieldId', f.fieldId)
    if (f.academicLevel) params.set('academicLevel', f.academicLevel)
    if (f.minCitations)  params.set('minCitations', f.minCitations)
    if (f.minHIndex)     params.set('minHIndex', f.minHIndex)
    if (f.sortBy)        params.set('sortBy', f.sortBy)
    params.set('page', String(p))

    try {
      const res  = await fetch(`/api/researchers?${params.toString()}`)
      const data = await res.json()
      if (append) {
        setResearchers(prev => [...prev, ...(data.researchers ?? [])])
      } else {
        setResearchers(data.researchers ?? [])
      }
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setPage(p)
    } catch (err) {
      console.error('Failed to fetch researchers', err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchResearchers(filters, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      const updated = { ...filters, search: pendingSearch }
      setFilters(updated)
      fetchResearchers(updated, 1)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSearch])

  function applyFilter(key: keyof FiltersState, value: string) {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    fetchResearchers(updated, 1)
  }

  function resetFilters() {
    const fresh: FiltersState = {
      search: '', fieldId: '', academicLevel: '',
      minCitations: '', minHIndex: '', sortBy: 'newest',
    }
    setFilters(fresh)
    setPendingSearch('')
    fetchResearchers(fresh, 1)
  }

  function loadMore() {
    fetchResearchers(filters, page + 1, true)
  }

  const hasActiveFilters =
    filters.fieldId || filters.academicLevel ||
    filters.minCitations || filters.minHIndex ||
    filters.sortBy !== 'newest'

  return (
    <div className="w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-black border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔎</span>
            <input
              type="text"
              placeholder="Search researchers..."
              value={pendingSearch}
              onChange={e => setPendingSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-white text-black border-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {[filters.fieldId, filters.academicLevel, filters.minCitations, filters.minHIndex]
                  .filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={e => applyFilter('sortBy', e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Field */}
              <select
                value={filters.fieldId}
                onChange={e => applyFilter('fieldId', e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500"
              >
                <option value="">All Fields</option>
                {fields.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              {/* Academic level */}
              <select
                value={filters.academicLevel}
                onChange={e => applyFilter('academicLevel', e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500"
              >
                <option value="">All Levels</option>
                {Object.entries(ACADEMIC_LEVEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* Min metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-500 mb-1 block">Min Citations</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={filters.minCitations}
                  onChange={e => applyFilter('minCitations', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 mb-1 block">Min H-Index</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={filters.minHIndex}
                  onChange={e => applyFilter('minHIndex', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="px-4 py-2 text-xs text-zinc-500 border-b border-zinc-800">
          {total} researcher{total !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Cards grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                    <div className="h-2.5 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-2.5 bg-zinc-800 rounded w-full" />
                  <div className="h-2.5 bg-zinc-800 rounded w-5/6" />
                </div>
                <div className="flex gap-1.5 mb-3">
                  <div className="h-5 bg-zinc-800 rounded-full w-16" />
                  <div className="h-5 bg-zinc-800 rounded-full w-20" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800">
                  {[0,1,2].map(j => (
                    <div key={j} className="flex flex-col items-center gap-1">
                      <div className="h-4 bg-zinc-800 rounded w-8" />
                      <div className="h-2 bg-zinc-800 rounded w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : researchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">🔬</p>
            <p className="text-zinc-400 font-medium mb-1">No researchers found</p>
            <p className="text-zinc-600 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {researchers.map(user => (
                <ResearcherCard key={user.id} user={user} />
              ))}
            </div>

            {page < totalPages && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
