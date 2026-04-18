import Link from 'next/link'

type PostPreview = {
  id: string
  title: string
  postType: string
  author: {
    displayName: string
    avatarUrl: string | null
  }
}

type ResearcherPreview = {
  id: string
  displayName: string
  avatarUrl: string | null
}

type RelatedContentSidebarProps = {
  relevantPosts: PostPreview[]
  researchers: ResearcherPreview[]
  fundingOpportunities: PostPreview[]
}

const postTypeColors: Record<string, string> = {
  collaboration: 'bg-blue-100 text-blue-800',
  help: 'bg-yellow-100 text-yellow-800',
  finished_work: 'bg-green-100 text-green-800',
  funding_opportunity: 'bg-purple-100 text-purple-800',
}

export default function RelatedContentSidebar({
  relevantPosts,
  researchers,
  fundingOpportunities
}: RelatedContentSidebarProps) {
  if (relevantPosts.length === 0 && researchers.length === 0 && fundingOpportunities.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      
      {/* Funding Opportunities Section */}
      {fundingOpportunities.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">💰</span> Funding Opportunities
          </h2>
          <div className="space-y-4">
            {fundingOpportunities.map(post => (
              <Link href={`/posts/${post.id}`} key={post.id} className="block group">
                <div className="p-3 bg-zinc-950 rounded-md border border-zinc-900 group-hover:border-zinc-700 transition">
                  <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <img 
                      src={post.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.displayName)}`} 
                      className="w-5 h-5 rounded-full" 
                      alt=""
                    />
                    <span className="text-xs text-zinc-500 truncate">{post.author.displayName}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Relevant Posts Section */}
      {relevantPosts.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">📄</span> Related Posts
          </h2>
          <div className="space-y-4">
            {relevantPosts.map(post => (
              <Link href={`/posts/${post.id}`} key={post.id} className="block group">
                <div className="p-3 bg-zinc-950 rounded-md border border-zinc-900 group-hover:border-zinc-700 transition">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${postTypeColors[post.postType] || 'bg-gray-100 text-gray-800'}`}>
                    {post.postType.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-2 group-hover:text-blue-400 line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <img 
                      src={post.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.displayName)}`} 
                      className="w-5 h-5 rounded-full" 
                      alt=""
                    />
                    <span className="text-xs text-zinc-500 truncate">{post.author.displayName}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Researchers Section */}
      {researchers.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">👩‍🔬</span> Active Researchers
          </h2>
          <div className="flex flex-col gap-3">
            {researchers.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <img 
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`} 
                  className="w-8 h-8 rounded-full border border-zinc-700" 
                  alt=""
                />
                <span className="text-sm font-medium text-zinc-300">{user.displayName}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
