'use client'

import { useState } from 'react'

export default function ParaphraserPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [tone, setTone] = useState('Professional')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleParaphrase = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    setError('')
    setResult('')

    try {
      const res = await fetch('/api/paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone })
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data.paraphrasedText)
      } else {
        setError(data.error || 'Failed to paraphrase text')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while connecting to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12 w-full animate-fade-in relative min-h-screen">
      <div className="px-6 mt-6">
        <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Paraphraser</h1>
        <p className="text-zinc-400 mt-2 font-medium">Rewrite and improve your research texts and abstracts instantly using AI.</p>
      </div>
      
      <div className="px-6 flex flex-col gap-6 flex-1 w-full max-w-4xl mx-auto">
        {/* Input Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Original Text</h2>
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-black border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-white transition-colors"
            >
              <option value="Professional">Professional</option>
              <option value="Academic">Academic</option>
              <option value="Casual">Casual</option>
              <option value="Creative">Creative</option>
              <option value="Simplified">Simplified</option>
            </select>
          </div>
          
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="flex-1 min-h-[300px] w-full bg-black border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all resize-none"
          />
          
          <button 
            onClick={handleParaphrase}
            disabled={isLoading || !text.trim()}
            className="mt-4 w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin text-xl">⏳</span> Paraphrasing...
              </>
            ) : (
              <>
                <span className="text-xl">✨</span> Paraphrase Text
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Paraphrased Result</h2>
            <button 
              onClick={copyToClipboard}
              disabled={!result}
              className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-zinc-700"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>

          <div className="flex-1 w-full bg-black border border-zinc-800 rounded-xl p-4 text-white overflow-auto relative min-h-[300px]">
            {error && (
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {!result && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 italic px-6 text-center">
                Your enhanced and paraphrased text will appear here.
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-500">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin"></div>
                <p>Generating perfect phrasing...</p>
              </div>
            )}

            {!isLoading && result && (
              <div className="whitespace-pre-wrap leading-relaxed text-zinc-200">
                {result}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
