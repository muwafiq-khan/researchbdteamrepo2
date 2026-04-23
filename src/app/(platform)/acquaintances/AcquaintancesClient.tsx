"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EvaluationModal from '@/components/EvaluationModal'

type UserInfo = {
  id: string
  displayName: string
  avatarUrl: string | null
  email: string
}

type ConnectionItem = {
  connectionId: string
  user: UserInfo
  canEvaluate?: boolean
}

type SearchResultUser = UserInfo & {
  relationshipStatus: string
}

type Props = {
  initialIncoming: ConnectionItem[]
  initialOutgoing: ConnectionItem[]
  initialAcquaintances: ConnectionItem[]
}

export default function AcquaintancesClient({ initialIncoming, initialOutgoing, initialAcquaintances }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)
  const [evaluateUser, setEvaluateUser] = useState<{id: string, name: string} | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`/api/connections/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.results) {
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAction = async (action: string, targetUserId: string) => {
    setLoadingActionId(targetUserId)
    try {
      // Execute the action
      const res = await fetch('/api/connections/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, targetUserId })
      })

      if (res.ok) {
        // Re-run search if we have a search query so status updates text buttons
        if (searchQuery.trim()) {
           const searchRes = await fetch(`/api/connections/search?q=${encodeURIComponent(searchQuery)}`)
           const searchData = await searchRes.json()
           if (searchData.results) {
             setSearchResults(searchData.results)
           }
        }
        
        // Refresh server-side props
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Action failed')
      }
    } catch (error) {
      console.error('Action error', error)
    } finally {
      setLoadingActionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12 w-full">
      {/* Search Section */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-4">Find New Acquaintances</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search by email address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          <button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <h3 className="text-zinc-400 font-semibold text-sm uppercase tracking-wider mb-2">Search Results</h3>
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xl border-2 border-zinc-700">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-white font-bold text-lg truncate">{user.displayName}</h4>
                    <span className="text-zinc-500 text-sm truncate block">{user.email}</span>
                  </div>
                </div>
                
                <div>
                  {user.relationshipStatus === 'Add Acquaintance' && (
                    <button 
                      onClick={() => handleAction('send', user.id)}
                      disabled={loadingActionId === user.id}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
                    >
                      {loadingActionId === user.id ? 'Sending...' : 'Add Acquaintance'}
                    </button>
                  )}
                  {user.relationshipStatus === 'Request Sent' && (
                    <span className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-medium text-sm">Request Sent</span>
                  )}
                  {user.relationshipStatus === 'Request Received' && (
                    <span className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg font-medium text-sm border border-orange-500/30">Request Received</span>
                  )}
                  {user.relationshipStatus === 'Already Acquainted' && (
                    <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium text-sm border border-green-500/30">Already Acquainted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Incoming Requests */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6">Received Requests</h2>
        {initialIncoming.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 rounded-xl border border-zinc-800/50">
            <p className="text-zinc-500 font-medium">No pending incoming requests</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {initialIncoming.map(({ user }) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                 <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-white font-semibold truncate">{user.displayName}</h4>
                    <span className="text-zinc-500 text-xs truncate block">{user.email}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleAction('accept', user.id)}
                    disabled={loadingActionId === user.id}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleAction('decline', user.id)}
                    disabled={loadingActionId === user.id}
                    className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 hover:border-red-600 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing Requests */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6">Sent Requests</h2>
        {initialOutgoing.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 rounded-xl border border-zinc-800/50">
            <p className="text-zinc-500 font-medium">No pending outgoing requests</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {initialOutgoing.map(({ user }) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                 <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-white font-semibold truncate">{user.displayName}</h4>
                    <span className="text-zinc-500 text-xs truncate block">{user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleAction('cancel', user.id)}
                  disabled={loadingActionId === user.id}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Acquaintances List */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6">Acquaintances</h2>
        {initialAcquaintances.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 rounded-xl border border-zinc-800/50">
            <p className="text-zinc-500 font-medium">You don't have any acquaintances yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {initialAcquaintances.map(({ user, canEvaluate }) => (
              <div key={user.id} className="flex flex-col p-5 bg-zinc-950 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-14 h-14 rounded-full object-cover border-2 border-zinc-800" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xl border-2 border-zinc-700">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-white font-bold truncate">{user.displayName}</h4>
                    <span className="text-zinc-500 text-xs truncate block">{user.email}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: loadingActionId === user.id ? 1 : undefined }}>
                  {canEvaluate && (
                    <button 
                      onClick={() => setEvaluateUser({ id: user.id, name: user.displayName })}
                      className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-600/30 text-zinc-400 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                      Evaluate
                    </button>
                  )}
                  <button 
                    onClick={() => handleAction('remove', user.id)}
                    disabled={loadingActionId === user.id}
                    className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-red-600/10 hover:text-red-500 hover:border-red-600/30 text-zinc-400 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {loadingActionId === user.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <EvaluationModal 
        isOpen={!!evaluateUser} 
        onClose={() => setEvaluateUser(null)} 
        evaluateeId={evaluateUser?.id || ''} 
        evaluateeName={evaluateUser?.name || ''} 
      />
    </div>
  )
}
