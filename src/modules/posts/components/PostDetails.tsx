// src/modules/posts/components/PostDetails.tsx

type PostDetailsProps = {
  post: any // Type from Prisma include
}

export default function PostDetails({ post }: PostDetailsProps) {
  const { postType } = post

  const renderTypeSpecificDetails = () => {
    switch (postType) {
      case 'collaboration':
        const collab = post.collaborationPost
        if (!collab) return null
        return (
          <div className="space-y-6">
            <Section title="Problem Statement" content={collab.problemStatement} />
            <Section title="Domain Description" content={collab.domainDescription} />
            <Section title="Proposed Approach" content={collab.proposedApproach} />
            <Section title="Expected Outcome" content={collab.expectedOutcome} />
            <div className="grid grid-cols-2 gap-4">
              <InfoBox label="Research Level" value={collab.researchLevel} />
              <InfoBox label="Max Collaborators" value={collab.maxCollaborators} />
            </div>
          </div>
        )
      case 'help':
        const help = post.helpPost
        if (!help) return null
        return (
          <div className="space-y-6">
            <Section title="Problem Specification" content={help.problemSpecification} />
            <Section title="Where I am stuck" content={help.whereStuck} />
            <Section title="What I have tried" content={help.whatTried} />
            <InfoBox label="Min Qualification Score" value={help.minQualificationScore} />
          </div>
        )
      case 'finished_work':
        const work = post.finishedWorkPost
        if (!work) return null
        return (
          <div className="space-y-6">
            <Section title="Methodology" content={work.methodology} />
            <Section title="Key Findings" content={work.keyFindings} />
            <Section title="Future Scope" content={work.futureScope} />
            <div className="flex flex-wrap gap-4">
              {work.paperUrl && <ExternalLink label="View Paper" href={work.paperUrl} />}
              {work.githubUrl && <ExternalLink label="View Code" href={work.githubUrl} />}
            </div>
          </div>
        )
      case 'funding_opportunity':
        const funding = post.fundingOpportunityPost
        if (!funding) return null
        return (
          <div className="space-y-6">
            <Section title="Deliverables" content={funding.deliverables} />
            <Section title="Contact Information" content={funding.contactInfo} />
            <div className="grid grid-cols-2 gap-4">
              <InfoBox 
                label="Funding Range" 
                value={funding.fundingAmountMin && funding.fundingAmountMax 
                  ? `$${funding.fundingAmountMin} - $${funding.fundingAmountMax}` 
                  : 'Contact for details'
                } 
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="mt-6 border-t border-zinc-800 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderTypeSpecificDetails()}
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content) return null
  return (
    <div>
      <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">{title}</h4>
      <p className="text-white leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined) return null
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
      <h4 className="text-xs font-bold text-zinc-500 uppercase mb-1">{label}</h4>
      <p className="text-lg text-white font-semibold">{value}</p>
    </div>
  )
}

function ExternalLink({ label, href }: { label: string; href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700"
    >
      {label} <span className="ml-2">↗</span>
    </a>
  )
}
