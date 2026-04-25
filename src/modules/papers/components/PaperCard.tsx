import Link from 'next/link';
import { OpenAlexWork } from '../types/openAlex';

interface PaperCardProps {
  work: OpenAlexWork;
}

export default function PaperCard({ work }: PaperCardProps) {
  // Format authors list (e.g., "John Doe, Jane Smith, et al.")
  const formatAuthors = () => {
    if (!work.authorships || work.authorships.length === 0) return 'Unknown Authors';
    
    const maxAuthors = 3;
    const authorNames = work.authorships
      .slice(0, maxAuthors)
      .map(a => a.author.display_name);
      
    if (work.authorships.length > maxAuthors) {
      return `${authorNames.join(', ')} et al.`;
    }
    return authorNames.join(', ');
  };

  // Get the short ID for routing
  const getShortId = () => {
    return work.id.replace('https://openalex.org/', '');
  };

  // Truncate abstract if it's too long
  const getAbstractSnippet = () => {
    if (!work.abstract) return 'No abstract available for this paper.';
    const maxLength = 350;
    if (work.abstract.length <= maxLength) return work.abstract;
    return `${work.abstract.substring(0, maxLength)}...`;
  };

  // Prefer PDF URL, then Landing Page URL, then DOI
  const getPaperUrl = () => {
    if (work.primary_location?.pdf_url) return work.primary_location.pdf_url;
    if (work.primary_location?.landing_page_url) return work.primary_location.landing_page_url;
    if (work.doi) return work.doi;
    return null;
  };

  const paperUrl = getPaperUrl();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md hover:border-zinc-700 transition-colors flex flex-col gap-4">
      
      {/* Header: Title and Year */}
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-xl font-bold text-white leading-snug">
          {paperUrl ? (
            <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              {work.title || 'Untitled Work'}
            </a>
          ) : (
            <span>{work.title || 'Untitled Work'}</span>
          )}
        </h3>
        <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          {work.publication_year}
        </span>
      </div>

      {/* Authors */}
      <div className="text-zinc-400 text-sm font-medium flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {formatAuthors()}
      </div>

      {/* Abstract */}
      <p className="text-zinc-300 text-sm leading-relaxed mt-2">
        {getAbstractSnippet()}
      </p>

      {/* Footer: Citations and Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        <Link 
          href={`/discovery/paper/${getShortId()}`}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold group"
        >
          <svg className="w-5 h-5 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {work.cited_by_count} Citations
        </Link>

        {paperUrl && (
          <a 
            href={paperUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors"
          >
            Read Full Paper
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
