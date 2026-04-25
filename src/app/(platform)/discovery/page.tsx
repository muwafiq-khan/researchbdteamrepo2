'use client';

import { useState, useEffect } from 'react';
import { OpenAlexWork, OpenAlexAuthor } from '@/modules/papers/types/openAlex';
import { getTrendingWorks, searchWorks, getAuthorProfile } from '@/modules/papers/services/openAlexService';
import PaperCard from '@/modules/papers/components/PaperCard';
import AuthorProfileCard from '@/modules/papers/components/AuthorProfileCard';

export default function DiscoveryPage() {
  const [works, setWorks] = useState<OpenAlexWork[]>([]);
  const [author, setAuthor] = useState<OpenAlexAuthor | null>(null);
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [cursor, setCursor] = useState<string | undefined>('*');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load initial trending works
  useEffect(() => {
    async function loadInitial() {
      try {
        const response = await getTrendingWorks('*');
        setWorks(response.results);
        setCursor(response.meta.next_cursor);
        setHasMore(!!response.meta.next_cursor);
      } catch (error) {
        console.error("Failed to load trending works", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      // Reset to trending if query is empty
      setIsLoading(true);
      setAuthor(null);
      setIsSearching(false);
      try {
        const response = await getTrendingWorks('*');
        setWorks(response.results);
        setCursor(response.meta.next_cursor);
        setHasMore(!!response.meta.next_cursor);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    setAuthor(null);
    setWorks([]);
    
    try {
      // Run both author profile search and paper search simultaneously
      const [authorRes, worksRes] = await Promise.allSettled([
        getAuthorProfile(query),
        searchWorks(query, '*')
      ]);

      if (authorRes.status === 'fulfilled' && authorRes.value) {
        // Simple heuristic: if the exact query matches part of the author name (case insensitive)
        if (authorRes.value.display_name.toLowerCase().includes(query.toLowerCase())) {
          setAuthor(authorRes.value);
        }
      }

      if (worksRes.status === 'fulfilled') {
        setWorks(worksRes.value.results);
        setCursor(worksRes.value.meta.next_cursor);
        setHasMore(!!worksRes.value.meta.next_cursor);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!cursor || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      let response;
      if (isSearching && query.trim()) {
        response = await searchWorks(query, cursor);
      } else {
        response = await getTrendingWorks(cursor);
      }
      
      setWorks(prev => [...prev, ...response.results]);
      setCursor(response.meta.next_cursor);
      setHasMore(!!response.meta.next_cursor);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Header & Search */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-4 drop-shadow-md">Research Discovery</h1>
        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
          Explore millions of research papers, authors, and topics powered by the open global research graph.
        </p>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for papers by keyword, topic, or author name..."
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-6 py-4 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg shadow-lg pr-16"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Author Profile Match */}
          {author && (
            <div className="mb-10 animate-fade-in">
              <h3 className="text-zinc-500 font-bold uppercase tracking-wider mb-3 text-sm">Author Match</h3>
              <AuthorProfileCard author={author} />
            </div>
          )}

          {/* Feed Title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              {isSearching ? `Results for "${query}"` : 'Trending Papers'}
            </h2>
            <span className="text-zinc-500 text-sm font-semibold">{works.length} loaded</span>
          </div>

          {/* Papers Feed */}
          {works.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
              <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No papers found</h3>
              <p className="text-zinc-400">Try adjusting your search terms or keywords.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {works.map((work) => (
                <PaperCard key={work.id} work={work} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && works.length > 0 && (
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
                  'Load More Papers'
                )}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
