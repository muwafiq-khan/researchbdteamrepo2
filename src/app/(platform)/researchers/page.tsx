'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFilterData } from '@/shared/providers/FilterDataProvider'

// ─── TYPES ────────────────────────────────────────────────────

type Researcher = {
  id: string
  displayName: string
  avatarUrl: string | null
  researcher: {
    academicLevel: string | null
    institution: string | null
    bio: string | null
    researchFields: { field: { id: string; name: string } }[]
    qualification: {
      hIndex: number
      citationCount: number
      publicationCount: number
      qualificationScore: number
    } | null
  } | null
}

const LEVELS: Record<string, string> = {
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  phd: 'PhD',
  professor: 'Professor',
  researcher: 'Researcher',
  industry: 'Industry',
}

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest' },
  { value: 'citations', label: 'Most Citations' },
  { value: 'hIndex',    label: 'Highest H-Index' },
  { value: 'qualScore', label: 'Qualification Score' },
  { value: 'pubs',      label: 'Most Publications' },
]

// ─── MAIN PAGE ────────────────────────────────────────────────

export default function ResearchersPage() {
  const { fields } = useFilterData()

  // Filter state — each dropdown updates one of these
  const [fieldId, setFieldId]             = useState('')
  const [academicLevel, setAcademicLevel] = useState('')
  const [minCitations, setMinCitations]   = useState('')
  const [minHIndex, setMinHIndex]         = useState('')
  const [sortBy, setSortBy]               = useState('newest')

  const [researchers, setResearchers] = useState<Researcher[]>([])
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [isLoading, setIsLoading]     = useState(true)

  // Build query string and fetch from /api/researchers
  async function fetchResearchers(p: number, append = false) {
    setIsLoading(true)

    const params = new URLSearchParams()
    if (fieldId)       params.set('fieldId', fieldId)
    if (academicLevel) params.set('academicLevel', academicLevel)
    if (minCitations)  params.set('minCitations', minCitations)
    if (minHIndex)     params.set('minHIndex', minHIndex)
    if (sortBy)        params.set('sortBy', sortBy)
    params.set('page', String(p))

    const res  = await fetch(`/api/researchers?${params.toString()}`)
    const data = await res.json()

    if (append) {
      setResearchers(prev => [...prev, ...(data.researchers ?? [])])
    } else {
      setResearchers(data.researchers ?? [])
    }

    setTotalPages(data.totalPages)
    setPage(p)
    setIsLoading(false)
  }

  // Re-fetch whenever any filter changes, reset to page 1
  useEffect(() => {
    fetchResearchers(1)
  }, [fieldId, academicLevel, minCitations, minHIndex, sortBy])

  return (
    <div className="w-full p-4">

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2 mb-6">

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={fieldId} onChange={e => setFieldId(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none">
          <option value="">All Fields</option>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <select value={academicLevel} onChange={e => setAcademicLevel(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none">
          <option value="">All Levels</option>
          {Object.entries(LEVELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>

        <input type="number" min="0" placeholder="Min Citations" value={minCitations}
          onChange={e => setMinCitations(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 w-32 focus:outline-none placeholder-zinc-600" />

        <input type="number" min="0" placeholder="Min H-Index" value={minHIndex}
          onChange={e => setMinHIndex(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 w-32 focus:outline-none placeholder-zinc-600" />

      </div>

      {/* Cards grid */}
      {isLoading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : researchers.length === 0 ? (
        <p className="text-zinc-500 text-sm">No researchers found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {researchers.map(user => {
              const r = user.researcher
              const q = r?.qualification
              return (
                <Link key={user.id} href={`/profile/${user.id}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors">

                  <p className="text-white font-semibold text-sm">{user.displayName}</p>
                  {r?.academicLevel && <p className="text-zinc-400 text-xs mt-0.5">{LEVELS[r.academicLevel] ?? r.academicLevel}</p>}
                  {r?.institution   && <p className="text-zinc-500 text-xs">{r.institution}</p>}
                  {r?.bio           && <p className="text-zinc-400 text-xs mt-2 line-clamp-2">{r.bio}</p>}

                  {r && r.researchFields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.researchFields.slice(0, 3).map(({ field }) => (
                        <span key={field.id} className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{field.name}</span>
                      ))}
                    </div>
                  )}

                  {q && (
                    <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 mt-3 text-center">
                      <div>
                        <p className="text-white text-sm font-bold">{q.citationCount}</p>
                        <p className="text-zinc-500 text-[10px]">Citations</p>
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{q.hIndex}</p>
                        <p className="text-zinc-500 text-[10px]">H-Index</p>
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{q.publicationCount}</p>
                        <p className="text-zinc-500 text-[10px]">Publications</p>
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center mt-6">
              <button onClick={() => fetchResearchers(page + 1, true)}
                className="px-6 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm rounded-full transition-colors">
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}