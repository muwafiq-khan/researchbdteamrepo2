'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { OpenAlexWork } from '@/modules/papers/types/openAlex';
import { getWorkById, getCitationsForPaper } from '@/modules/papers/services/openAlexService';
import PaperCard from '@/modules/papers/components/PaperCard';

export default function PaperCitationsPage() {
  const params = useParams();
  const id = params.id as string;

  const [paper, setPaper] = useState<OpenAlexWork | null>(null);
  const [citations, setCitations] = useState<OpenAlexWork[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [cursor, setCursor] = useState<string | undefined>('*');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        // Load paper details and first page of citations in parallel
        const [paperData, citationsRes] = await Promise.all([
          getWorkById(id),
          getCitationsForPaper(id, '*')
        ]);

        if (!paperData) {
          setError('Paper not found.');
          return;
        }

        setPaper(paperData);
        setCitations(citationsRes.results);
        setCursor(citationsRes.meta.next_cursor);
        setHasMore(!!citationsRes.meta.next_cursor);
      } catch (err: any) {
        console.error(err);
        setError('An error occurred while fetching the paper data.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleLoadMore = async () => {
    if (!cursor || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await getCitationsForPaper(id, cursor);
      setCitations(prev => [...prev, ...response.results]);
      setCursor(response.meta.next_cursor);
      setHasMore(!!response.meta.next_cursor);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-4">Oops!</h1>
        <p className="text-zinc-400 mb-8">{error}</p>
        <Link href="/discovery" className="text-blue-400 hover:underline">
          &larr; Back to Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Back button */}
      <Link href="/discovery" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Discovery
      </Link>

      {/* Target Paper Highlight */}
      <div className="mb-12">
        <h2 className="text-zinc-500 font-bold uppercase tracking-wider mb-4 text-sm">Target Paper</h2>
        <div className="ring-2 ring-blue-500 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <PaperCard work={paper} />
        </div>
      </div>

      {/* Citations List */}
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Cited By ({paper.cited_by_count})
        </h2>
      </div>

      {citations.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-400">No citations found for this paper.</p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
          {citations.map((work) => (
            <div key={work.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-zinc-900 text-zinc-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              
              {/* Card Container */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-2">
                <PaperCard work={work} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && citations.length > 0 && (
        <div className="flex justify-center pt-8 pb-12">
          <button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-full border border-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {isLoadingMore ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Load More Citations'
            )}
          </button>
        </div>
      )}

    </div>
  );
}
