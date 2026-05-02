'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFilterData } from '@/shared/providers/FilterDataProvider'

// ─── TYPES ────────────────────────────────────────────────────────────────────
// Shape of one researcher returned from the API

type Researcher = {
  id: string
  displayName: string
  avatarUrl: string | null
  researcher: {
    academicLevel: string | null
    institution: string | null
    bio: string | null
    researchFields: { field: { id: string; name: string } }[]
    qualification: { hIndex: number; citationCount: number; publicationCount: number } | null
  } | null
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Used to display human-readable labels instead of raw DB values

const LEVELS: Record<string, string> = {
  undergraduate: 'Undergraduate',
  postgraduate:  'Postgraduate',
  phd:           'PhD',
  professor:     'Professor',
  researcher:    'Researcher',
  industry:      'Industry',
}

// Dropdown options for the sort filter — value goes to API, label shows in UI
const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest' },
  { value: 'citations',   label: 'Most Citations' },
  { value: 'hIndex',      label: 'Highest H-Index' },
  { value: 'qualScore',   label: 'Qualification Score' },
  { value: 'pubs',        label: 'Most Publications' },
  { value: 'alphabetical', label: 'Alphabetical' },
]

// ─── PAGE COMPONENT ───────────────────────────────────────────────────────────

export default function ResearchersPage() {

  // fields comes from a global provider — list of all research fields from DB
  const { fields } = useFilterData()

  // ── Filter state — each one maps to a query param sent to the API ──
  const [field_id, set_field_id]             = useState('')
  const [academic_level, set_academic_level] = useState('')
  const [min_citations, set_min_citations]   = useState('')
  const [min_hindex, set_min_hindex]         = useState('')
  const [sort_by, set_sort_by]               = useState('newest')

  // ── Result state ──
  const [researchers, set_researchers] = useState<Researcher[]>([])  // cards shown on screen
  const [page, set_page]               = useState(1)                  // current page number
  const [total_pages, set_total_pages] = useState(1)                  // total pages available
  const [is_loading, set_is_loading]   = useState(true)               // shows "Loading..." text

  // ─── FETCH FUNCTION ───────────────────────────────────────────────────────
  // Called whenever filters change or Load More is clicked
  // append=false → replace the list (new filter applied)
  // append=true  → add to the list (Load More clicked)

  async function fetch_researchers(p: number, append: boolean) {
    set_is_loading(true)

    // Build URL query string — only include filters that have a value
    const params = new URLSearchParams()
    if (field_id)       params.set('fieldId', field_id)
    if (academic_level) params.set('academicLevel', academic_level)
    if (min_citations)  params.set('minCitations', min_citations)
    if (min_hindex)     params.set('minHIndex', min_hindex)
    if (sort_by)        params.set('sortBy', sort_by)
    params.set('page', String(p))

    // Hit the backend — e.g. /api/researchers?academicLevel=phd&sortBy=hIndex&page=1
    const res  = await fetch(`/api/researchers?${params.toString()}`)
    const data = await res.json()

    // Load More → keep existing cards and add new ones to the bottom
    // New filter → throw away old cards and show fresh results
    if (append) {
      const combined = researchers.concat(data.researchers ?? [])
      set_researchers(combined)
    } else {
      set_researchers(data.researchers ?? [])
    }

    set_total_pages(data.totalPages)
    set_page(p)
    set_is_loading(false)
  }

  // Re-fetch from page 1 whenever any filter state changes
  useEffect(function () {
    fetch_researchers(1, false)
  }, [field_id, academic_level, min_citations, min_hindex, sort_by])

  // Fetches next page and appends results to existing list
  function load_more() {
    fetch_researchers(page + 1, true)
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full p-4">

      {/* ── Filter dropdowns — each onChange updates its state → triggers useEffect → re-fetches ── */}
      <div className="flex flex-wrap gap-2 mb-6">

        <select value={sort_by} onChange={function on_sort(e) { set_sort_by(e.target.value) }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none">
          {SORT_OPTIONS.map(function render_option(o) {
            return <option key={o.value} value={o.value}>{o.label}</option>
          })}
        </select>

        <select value={field_id} onChange={function on_field(e) { set_field_id(e.target.value) }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none">
          <option value="">All Fields</option>
          {fields.map(function render_field(f) {
            return <option key={f.id} value={f.id}>{f.name}</option>
          })}
        </select>

        <select value={academic_level} onChange={function on_level(e) { set_academic_level(e.target.value) }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none">
          <option value="">All Levels</option>
          {Object.entries(LEVELS).map(function render_level([val, label]) {
            return <option key={val} value={val}>{label}</option>
          })}
        </select>

        {/* Numeric inputs — user types a number, filters by minimum value */}
        <input type="number" min="0" placeholder="Min Citations" value={min_citations}
          onChange={function on_citations(e) { set_min_citations(e.target.value) }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 w-32 focus:outline-none placeholder-zinc-600" />

        <input type="number" min="0" placeholder="Min H-Index" value={min_hindex}
          onChange={function on_hindex(e) { set_min_hindex(e.target.value) }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 w-32 focus:outline-none placeholder-zinc-600" />

      </div>

      {/* ── Loading state ── */}
      {is_loading && <p className="text-zinc-500 text-sm">Loading...</p>}

      {/* ── Empty state — shown when fetch is done but no results matched ── */}
      {!is_loading && researchers.length === 0 && (
        <p className="text-zinc-500 text-sm">No researchers found.</p>
      )}

      {/* ── Results — shown when fetch is done and we have data ── */}
      {!is_loading && researchers.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {researchers.map(function render_researcher(user) {
              const r = user.researcher
              const q = r?.qualification
              return (
                <Link key={user.id} href={`/profile/${user.id}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors">

                  {/* Basic info */}
                  <p className="text-white font-semibold text-sm">{user.displayName}</p>
                  {r?.academicLevel && <p className="text-zinc-400 text-xs mt-0.5">{LEVELS[r.academicLevel] ?? r.academicLevel}</p>}
                  {r?.institution   && <p className="text-zinc-500 text-xs">{r.institution}</p>}
                  {r?.bio           && <p className="text-zinc-400 text-xs mt-2 line-clamp-2">{r.bio}</p>}

                  {/* Research field tags — show max 3 */}
                  {r && r.researchFields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.researchFields.slice(0, 3).map(function render_tag({ field }) {
                        return <span key={field.id} className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{field.name}</span>
                      })}
                    </div>
                  )}

                  {/* Academic metrics — only shown if qualification data exists */}
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

          {/* Load More — only shown if more pages exist */}
          {page < total_pages && (
            <div className="flex justify-center mt-6">
              <button onClick={load_more}
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
