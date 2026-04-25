'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EvaluationModal from '@/components/EvaluationModal'

export default function ProfileContainer({ profileUser, isOwner, allFields, aggregatedEvaluations, givenEvaluations }: any) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [displayName, setDisplayName] = useState(profileUser.displayName || '')
  const [avatarUrl, setAvatarUrl] = useState(profileUser.avatarUrl || '')
  const [bio, setBio] = useState(profileUser.researcher?.bio || '')
  const [profileVisibility, setProfileVisibility] = useState(profileUser.profileVisibility || 'public')
  const [appearInSearch, setAppearInSearch] = useState(profileUser.appearInSearch ?? true)
  
  // Array states
  const [skills, setSkills] = useState<string[]>(profileUser.researcher?.skills || [])
  const [newSkill, setNewSkill] = useState('')
  
  const [researchFieldIds, setResearchFieldIds] = useState<string[]>(
    profileUser.researcher?.researchFields?.map((rf: any) => rf.fieldId) || []
  )
  
  const [publications, setPublications] = useState<any[]>(profileUser.researcher?.publications || [])
  const [institutions, setInstitutions] = useState<any[]>(profileUser.researcher?.institutions || [])

  // Evaluation Modal State
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [selectedEvaluateeId, setSelectedEvaluateeId] = useState('')
  const [selectedEvaluateeName, setSelectedEvaluateeName] = useState('')

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Flush newSkill to skills if it exists
    let finalSkills = [...skills]
    if (newSkill.trim() !== '' && !finalSkills.includes(newSkill.trim())) {
      finalSkills.push(newSkill.trim())
      setSkills(finalSkills)
      setNewSkill('')
    }

    const validPublications = publications.filter(p => p.title.trim() !== '')
    const validInstitutions = institutions.filter(i => i.institutionName.trim() !== '')
    setPublications(validPublications)
    setInstitutions(validInstitutions)

    try {
      const payload = {
        accountType: profileUser.accountType,
        displayName,
        avatarUrl,
        bio,
        profileVisibility,
        appearInSearch,
        skills: finalSkills,
        researchFieldIds,
        publications: validPublications,
        institutions: validInstitutions
      }

      const res = await fetch(`/api/profile/${profileUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsEditing(false)
        router.refresh()
      } else {
        alert('Failed to save profile.')
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault()
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()])
      }
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const toggleField = (fieldId: string) => {
    setResearchFieldIds(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId)
      } else {
        return [...prev, fieldId]
      }
    })
  }

  // Helper renderers for lists
  const renderPublications = () => {
    if (publications.length === 0) return <p className="text-zinc-500 italic">No publications listed.</p>
    return (
      <div className="space-y-4">
        {publications.map((pub, idx) => (
          <div key={idx} className="bg-zinc-900 p-4 rounded-lg relative">
            {isEditing && (
              <button 
                onClick={() => setPublications(publications.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-400"
              >
                ✕
              </button>
            )}
            <h4 className="font-bold text-white text-lg">{pub.title}</h4>
            <p className="text-zinc-400 text-sm">({pub.year})</p>
            {pub.coAuthors && <p className="text-zinc-500 text-sm mt-1">Authors: {pub.coAuthors}</p>}
            {pub.linkOrDoi && (
              <a href={pub.linkOrDoi.startsWith('http') ? pub.linkOrDoi : `https://doi.org/${pub.linkOrDoi}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm mt-2 inline-block">
                View Publication ↗
              </a>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderInstitutions = () => {
    if (institutions.length === 0) return <p className="text-zinc-500 italic">No institutions listed.</p>
    return (
      <div className="space-y-4">
        {institutions.map((inst, idx) => (
          <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 relative">
            {isEditing && (
              <button 
                onClick={() => setInstitutions(institutions.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-400"
              >
                ✕
              </button>
            )}
            <h4 className="font-bold text-white text-lg">{inst.institutionName}</h4>
            <p className="text-zinc-300">{inst.rolePosition}</p>
            <p className="text-zinc-500 text-sm mt-1">
              {new Date(inst.startDate).getFullYear()} - {inst.endDate ? new Date(inst.endDate).getFullYear() : 'Present'}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-12 w-full animate-fade-in relative">
      {/* Header Cover Area */}
      <div className="h-48 bg-zinc-900 border-b border-zinc-800 w-full relative rounded-b-2xl shadow-sm">
        {isOwner && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
          >
            Edit Profile
          </button>
        )}
        {isEditing && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="px-6 relative -mt-16">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-black bg-zinc-800 overflow-hidden shrink-0 shadow-2xl relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-500 uppercase">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="mb-2">
            {isEditing ? (
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white text-3xl font-bold px-3 py-1 rounded-md w-full focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Display Name"
              />
            ) : (
              <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{displayName}</h1>
            )}
            <p className="text-zinc-400 mt-1 capitalize font-medium">{profileUser.accountType}</p>
          </div>
        </div>

        {isEditing && (
          <div className="mb-6 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-3">Profile Picture</h3>
            <div className="flex flex-col gap-2">
              <label className="text-zinc-400 text-sm">Upload Image</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarChange}
                className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            
            {/* About Section */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              {isEditing && profileUser.accountType === 'researcher' ? (
                <textarea 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl w-full h-32 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                  placeholder="Tell us about your research and background..."
                />
              ) : (
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {bio || <span className="text-zinc-600 italic">No bio provided.</span>}
                </p>
              )}
            </section>

            {/* Experience / Institutions */}
            {profileUser.accountType === 'researcher' && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Experience</h2>
                  {isEditing && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (institutions.some(i => i.institutionName.trim() === '')) return
                        setInstitutions([{ institutionName: '', rolePosition: '', startDate: '', endDate: null }, ...institutions])
                      }}
                      className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-full transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    {institutions.map((inst, idx) => (
                      <div key={idx} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex justify-between">
                          <input type="text" value={inst.institutionName} onChange={e => { const newInsts = [...institutions]; newInsts[idx].institutionName = e.target.value; setInstitutions(newInsts) }} className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md flex-1 mr-2" placeholder="Institution Name" />
                          <button onClick={() => setInstitutions(institutions.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 p-2">✕</button>
                        </div>
                        <input type="text" value={inst.rolePosition} onChange={e => { const newInsts = [...institutions]; newInsts[idx].rolePosition = e.target.value; setInstitutions(newInsts) }} className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full" placeholder="Role/Position" />
                        <div className="flex gap-2 items-center">
                          <input 
                            type="date" 
                            value={inst.startDate ? (typeof inst.startDate === 'string' && !inst.startDate.includes('T') ? inst.startDate : new Date(inst.startDate).toISOString().split('T')[0]) : ''} 
                            onChange={e => { const newInsts = [...institutions]; newInsts[idx].startDate = e.target.value; setInstitutions(newInsts) }} 
                            className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md text-sm" 
                          />
                          <span className="text-zinc-500">to</span>
                          <input 
                            type="date" 
                            value={inst.endDate ? (typeof inst.endDate === 'string' && !inst.endDate.includes('T') ? inst.endDate : new Date(inst.endDate).toISOString().split('T')[0]) : ''} 
                            onChange={e => { const newInsts = [...institutions]; newInsts[idx].endDate = e.target.value || null; setInstitutions(newInsts) }} 
                            className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md text-sm" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderInstitutions()
                )}
              </section>
            )}

            {/* Publications */}
            {profileUser.accountType === 'researcher' && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Publications</h2>
                  {isEditing && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (publications.some(p => p.title.trim() === '')) return
                        setPublications([{ title: '', journalOrConferenceName: '', year: '', coAuthors: '', linkOrDoi: '' }, ...publications])
                      }}
                      className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-full transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    {publications.map((pub, idx) => (
                      <div key={idx} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex justify-between">
                          <input type="text" value={pub.title} onChange={e => { const newPubs = [...publications]; newPubs[idx].title = e.target.value; setPublications(newPubs) }} className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md flex-1 mr-2" placeholder="Title" />
                          <button onClick={() => setPublications(publications.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 p-2">✕</button>
                        </div>
                        <input type="number" value={pub.year} onChange={e => { const newPubs = [...publications]; newPubs[idx].year = parseInt(e.target.value); setPublications(newPubs) }} className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full" placeholder="Year" />
                        <input type="text" value={pub.coAuthors || ''} onChange={e => { const newPubs = [...publications]; newPubs[idx].coAuthors = e.target.value; setPublications(newPubs) }} className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full" placeholder="Co-Authors" />
                        <input type="text" value={pub.linkOrDoi || ''} onChange={e => { const newPubs = [...publications]; newPubs[idx].linkOrDoi = e.target.value; setPublications(newPubs) }} className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full" placeholder="Link or DOI" />
                      </div>
                    ))}
                  </div>
                ) : (
                  renderPublications()
                )}
              </section>
            )}

            {/* Aggregated Evaluations */}
            {profileUser.accountType === 'researcher' && aggregatedEvaluations && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-4">Researcher Evaluation Summary</h2>
                <p className="text-zinc-400 text-sm mb-6">Based on {aggregatedEvaluations.count} evaluation{aggregatedEvaluations.count !== 1 ? 's' : ''} from peers.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Punctuality', score: aggregatedEvaluations.punctuality },
                    { label: 'Work Dedication', score: aggregatedEvaluations.dedication },
                    { label: 'Collaboration', score: aggregatedEvaluations.collaboration },
                    { label: 'Integrity', score: aggregatedEvaluations.integrity },
                    { label: 'Analytical Thinking', score: aggregatedEvaluations.analytical },
                    { label: 'Inquisitiveness', score: aggregatedEvaluations.inquisitiveness },
                    { label: 'Adaptability', score: aggregatedEvaluations.adaptability },
                    { label: 'Responsiveness', score: aggregatedEvaluations.responsiveness },
                    { label: 'Open-mindedness', score: aggregatedEvaluations.openMindedness },
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-300 text-sm font-medium">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white font-bold">{metric.score}</span>
                        <span className="text-zinc-500 text-xs">/ 5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Evaluation History (Owner Only) */}
            {isOwner && givenEvaluations && givenEvaluations.length > 0 && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-4">Your Evaluation History</h2>
                <p className="text-zinc-400 text-sm mb-6">Evaluations you have submitted for other researchers. You can edit them here.</p>
                <div className="space-y-4">
                  {givenEvaluations.map((evaluation: any) => (
                    <div key={evaluation.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${evaluation.evaluatee.id}`} className="hover:opacity-80 transition-opacity">
                          {evaluation.evaluatee.avatarUrl ? (
                            <img src={evaluation.evaluatee.avatarUrl} alt={evaluation.evaluatee.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm shrink-0">
                              {evaluation.evaluatee.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div>
                          <Link href={`/profile/${evaluation.evaluatee.id}`} className="hover:underline">
                            <h4 className="text-white font-bold">{evaluation.evaluatee.displayName}</h4>
                          </Link>
                          <p className="text-zinc-500 text-xs mt-0.5">
                            Evaluated on {new Date(evaluation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedEvaluateeId(evaluation.evaluatee.id)
                          setSelectedEvaluateeName(evaluation.evaluatee.displayName)
                          setIsEvalModalOpen(true)
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Edit Evaluation
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Skills */}
            {profileUser.accountType === 'researcher' && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <h3 className="text-xl font-bold text-white mb-4">Skills</h3>
                
                {isEditing && (
                  <div className="mb-4">
                    <input 
                      type="text" 
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={handleAddSkill}
                      className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full focus:outline-none focus:border-blue-500"
                      placeholder="Add your skills"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 && !isEditing && <p className="text-zinc-500 italic">No skills added.</p>}
                  {skills.map((skill, idx) => (
                    <span key={idx} className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
                      {skill}
                      {isEditing && (
                        <button onClick={() => handleRemoveSkill(skill)} className="text-zinc-400 hover:text-white rounded-full w-4 h-4 flex items-center justify-center">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Research Fields */}
            {profileUser.accountType === 'researcher' && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <h3 className="text-xl font-bold text-white mb-4">Research Fields</h3>
                
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {allFields.map((field: any) => {
                      const isSelected = researchFieldIds.includes(field.id)
                      return (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => toggleField(field.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected 
                            ? 'bg-white text-black' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          {field.name}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {researchFieldIds.length === 0 && <p className="text-zinc-500 italic">No fields selected.</p>}
                    {researchFieldIds.map(id => {
                      const field = allFields.find((f: any) => f.id === id)
                      return field ? (
                        <span key={id} className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1 rounded-lg text-sm font-medium">
                          {field.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Privacy Settings (Only visible to Owner in Edit mode) */}
            {isOwner && isEditing && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden border-l-4 border-l-zinc-500">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🔒</span> Privacy
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 text-sm mb-1">Profile Visibility</label>
                    <select 
                      value={profileVisibility}
                      onChange={e => setProfileVisibility(e.target.value)}
                      className="bg-black border border-zinc-700 text-white px-3 py-2 rounded-md w-full focus:outline-none focus:border-blue-500"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="friends_only">Acquaintances Only</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-400 text-sm">Appear in Search Results</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={appearInSearch} onChange={e => setAppearInSearch(e.target.checked)} />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
      
      {/* Evaluation Modal */}
      {isEvalModalOpen && (
        <EvaluationModal
          isOpen={isEvalModalOpen}
          onClose={() => {
            setIsEvalModalOpen(false)
            router.refresh() // Refresh to update the history dates or any changes
          }}
          evaluateeId={selectedEvaluateeId}
          evaluateeName={selectedEvaluateeName}
        />
      )}
    </div>
  )
}
