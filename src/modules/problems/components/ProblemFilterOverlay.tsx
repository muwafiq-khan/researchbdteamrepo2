
'use client'

import { useState } from 'react'
import { useFilterData } from '../../../shared/providers/FilterDataProvider'

type ActiveFilters = {
  fieldId: string | null
  subfieldId: string | null
  urgency: string | null
  country: string | null
}

type ProblemFilterOverlayProps = {
  filters: ActiveFilters
  onApply: (filters: ActiveFilters) => void
  onClose: () => void
}

export default function ProblemFilterOverlay({
  filters,
  onApply,
  onClose,
}: ProblemFilterOverlayProps) {

  const { fields, countries } = useFilterData()

  // Local draft — user picks filters here before hitting Apply.
  // We don't fire a fetch on every click. User builds their combo, then applies.
  const [draft, setDraft] = useState<ActiveFilters>(filters)

  // Which sub-section is expanded:
  // null = all collapsed, 'field' = field options showing, etc.
  const [openSection, setOpenSection] = useState<string | null>(null)

  // Subfields depend on which field is selected
  const selectedField = fields.find(function(f) { return f.id === draft.fieldId })
  const availableSubfields = selectedField ? selectedField.subfields : []

  function handleFieldSelect(fieldId: string) {
    setDraft({ ...draft, fieldId: fieldId, subfieldId: null })
    setOpenSection(null)
  }

  function handleSubfieldSelect(subfieldId: string) {
    setDraft({ ...draft, subfieldId: subfieldId })
    setOpenSection(null)
  }

  function handleUrgencySelect(urgency: string) {
    setDraft({ ...draft, urgency: urgency })
    setOpenSection(null)
  }

  function handleCountrySelect(country: string) {
    setDraft({ ...draft, country: country })
    setOpenSection(null)
  }

  function handleClear() {
    setDraft({ fieldId: null, subfieldId: null, urgency: null, country: null })
    setOpenSection(null)
  }

  function handleApply() {
    onApply(draft)
  }

  function getFieldName() {
    if (!draft.fieldId) return null
    const f = fields.find(function(f) { return f.id === draft.fieldId })
    return f ? f.name : null
  }

  function getSubfieldName() {
    if (!draft.subfieldId || !selectedField) return null
    const sf = selectedField.subfields.find(function(s) { return s.id === draft.subfieldId })
    return sf ? sf.name : null
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 w-full sm:w-96 sm:rounded-xl rounded-t-xl max-h-[80vh] overflow-y-auto"
        onClick={function(e) { e.stopPropagation() }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">Filter Problems</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 space-y-3">

          {/* ── FIELD ──────────────────────────────────────── */}
          <div>
            <button
              onClick={function() { setOpenSection(openSection === 'field' ? null : 'field') }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm text-zinc-300">Field</span>
              <span className="text-sm text-zinc-400">{getFieldName() || 'All'}</span>
            </button>
            {openSection === 'field' && (
              <div className="mt-2 space-y-1 pl-2">
                {fields.map(function(field) {
                  return (
                    <button
                      key={field.id}
                      onClick={function() { handleFieldSelect(field.id) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        draft.fieldId === field.id
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {field.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── SUBFIELD (only when field is picked) ───────── */}
          {draft.fieldId && availableSubfields.length > 0 && (
            <div>
              <button
                onClick={function() { setOpenSection(openSection === 'subfield' ? null : 'subfield') }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm text-zinc-300">Subfield</span>
                <span className="text-sm text-zinc-400">{getSubfieldName() || 'All'}</span>
              </button>
              {openSection === 'subfield' && (
                <div className="mt-2 space-y-1 pl-2">
                  {availableSubfields.map(function(sf) {
                    return (
                      <button
                        key={sf.id}
                        onClick={function() { handleSubfieldSelect(sf.id) }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          draft.subfieldId === sf.id
                            ? 'bg-blue-600 text-white'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {sf.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── URGENCY ────────────────────────────────────── */}
          <div>
            <button
              onClick={function() { setOpenSection(openSection === 'urgency' ? null : 'urgency') }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm text-zinc-300">Urgency</span>
              <span className="text-sm text-zinc-400">
                {draft.urgency ? draft.urgency.charAt(0).toUpperCase() + draft.urgency.slice(1) : 'All'}
              </span>
            </button>
            {openSection === 'urgency' && (
              <div className="mt-2 space-y-1 pl-2">
                {['critical', 'moderate', 'exploratory'].map(function(level) {
                  return (
                    <button
                      key={level}
                      onClick={function() { handleUrgencySelect(level) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        draft.urgency === level
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── COUNTRY ────────────────────────────────────── */}
          <div>
            <button
              onClick={function() { setOpenSection(openSection === 'country' ? null : 'country') }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm text-zinc-300">Country</span>
              <span className="text-sm text-zinc-400">{draft.country || 'All'}</span>
            </button>
            {openSection === 'country' && (
              <div className="mt-2 space-y-1 pl-2">
                {countries.map(function(c) {
                  return (
                    <button
                      key={c}
                      onClick={function() { handleCountrySelect(c) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        draft.country === c
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Bottom actions ───────────────────────────────── */}
        <div className="flex gap-3 px-4 py-4 border-t border-zinc-800">
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors"
          >
            Apply
          </button>
        </div>

      </div>
    </div>
  )
}