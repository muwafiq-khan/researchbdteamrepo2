import { OpenAlexAuthor } from '../types/openAlex';

interface AuthorProfileCardProps {
  author: OpenAlexAuthor;
}

export default function AuthorProfileCard({ author }: AuthorProfileCardProps) {
  const getInstitutionStr = () => {
    if (author.last_known_institution) {
      return `${author.last_known_institution.display_name} (${author.last_known_institution.country_code})`;
    }
    return 'Independent / Unknown Institution';
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
      
      {/* Avatar Placeholder */}
      <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-inner flex items-center justify-center text-3xl font-black text-white shrink-0">
        {author.display_name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-2xl font-black text-white mb-1">
          {author.display_name}
        </h2>
        
        <p className="text-zinc-400 text-sm font-medium mb-4 flex items-center justify-center sm:justify-start gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {getInstitutionStr()}
        </p>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <div className="bg-black/50 border border-zinc-800 rounded-xl px-4 py-2 text-center">
            <div className="text-white font-bold text-lg">{author.works_count?.toLocaleString() || 0}</div>
            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Publications</div>
          </div>
          
          <div className="bg-black/50 border border-zinc-800 rounded-xl px-4 py-2 text-center">
            <div className="text-white font-bold text-lg">{author.cited_by_count?.toLocaleString() || 0}</div>
            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Citations</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center sm:justify-start gap-3">
          {author.orcid && (
            <a 
              href={author.orcid} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z"/>
              </svg>
              View ORCID
            </a>
          )}
          <a 
            href={author.id} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            OpenAlex Profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
