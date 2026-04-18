// src/app/(platform)/problems/[problemId]/page.tsx
//
// THE INDIVIDUAL PROBLEM PAGE — the "Wikipedia article" for a research problem.
// This is a Server Component. Runs on the server, fetches from DB,
// sends pure HTML to browser. Zero client-side JavaScript.
//
// Django equivalent: a DetailView that does get_object_or_404(Problem, id=...)
// then renders a template with all the related data.

import { notFound } from 'next/navigation'
import { prisma } from '../../../../lib/prisma'
import RelatedContentSidebar from '../../../../shared/components/RelatedContentSidebar'

// ── Urgency helpers ───────────────────────────────────────────────
// Django equivalent: a model method like problem.get_urgency_color()

function getUrgencyColor(level: string) {
  if (level === 'critical') return 'bg-red-500'
  if (level === 'moderate') return 'bg-yellow-500'
  return 'bg-green-500'
}

function getUrgencyTextColor(level: string) {
  if (level === 'critical') return 'text-red-400'
  if (level === 'moderate') return 'text-yellow-400'
  return 'text-green-400'
}

function getUrgencyLabel(level: string) {
  if (level === 'critical') return 'Critical'
  if (level === 'moderate') return 'Moderate'
  return 'Exploratory'
}

// ── The page component ────────────────────────────────────────────
// In Next.js 15+, params is a Promise. You must await it.
//
// Django equivalent:
//   def get(self, request, problemId):
//       problem = get_object_or_404(Problem, id=problemId)
//       return render(request, 'problem_detail.html', {'problem': problem})

export default async function ProblemDetailPage(
  props: { params: Promise<{ problemId: string }> }
) {
  // Step 1: Extract the dynamic segment from the URL.
  // Python equivalent: problem_id = self.kwargs['problemId']
  const { problemId } = await props.params

  // Step 2: Fetch problem with all relations in ONE query.
  // Prisma's `include` = Django's select_related + prefetch_related.
  //
  // SQL Prisma generates (roughly):
  //   SELECT p.*, s.*, f.*
  //   FROM problems p
  //   JOIN subfields s ON p."subfieldId" = s.id
  //   JOIN fields f ON s."fieldId" = f.id
  //   WHERE p.id = $1
  //
  // Plus second query for many-to-many:
  //   SELECT paf.*, f.*
  //   FROM problem_applicable_fields paf
  //   JOIN fields f ON paf."fieldId" = f.id
  //   WHERE paf."problemId" = $1

  const problem = await prisma.problems.findUnique({
    where: { id: problemId },
    include: {
      subfield: {
        include: {
          field: true
        }
      },
      applicableFields: {
        include: {
          field: true
        }
      }
    }
  })

  // Step 3: If problem doesn't exist, trigger Next.js 404.
  // notFound() throws — like Django's Http404.
  // After this line, TypeScript KNOWS problem is not null.
  if (!problem) {
    notFound()
  }

  const relevantPosts = await prisma.posts.findMany({
    where: {
      problemId: problemId,
      postType: { not: 'funding_opportunity' },
      visibility: 'public'
    },
    take: 5,
    select: {
      id: true,
      title: true,
      postType: true,
      author: { select: { displayName: true, avatarUrl: true } }
    }
  })

  const fundingOpportunities = await prisma.posts.findMany({
    where: {
      problemId: problemId,
      postType: 'funding_opportunity',
      visibility: 'public'
    },
    take: 3,
    select: {
      id: true,
      title: true,
      postType: true,
      author: { select: { displayName: true, avatarUrl: true } }
    }
  })

  const postsInProblem = await prisma.posts.findMany({
    where: { problemId: problemId, visibility: 'public' },
    select: { author: { select: { id: true, displayName: true, avatarUrl: true } } }
  })

  const authorMap = new Map()
  for (const p of postsInProblem) {
    if (!authorMap.has(p.author.id)) {
      authorMap.set(p.author.id, p.author)
    }
  }
  const researchers = Array.from(authorMap.values()).slice(0, 5)

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">

        {/* ── HERO IMAGE ──────────────────────────────────── */}
        {problem.coverImageUrl && (
          <div className="w-full h-64 sm:h-80 overflow-hidden">
            <img
              src={problem.coverImageUrl}
              alt={problem.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ── CONTENT AREA ─────────────────────────────────── */}
        <div className="px-4 py-6 space-y-8">

          {/* ── Urgency + breadcrumb + title ────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${getUrgencyColor(problem.urgencyLevel)}`} />
              <span className={`text-sm font-semibold ${getUrgencyTextColor(problem.urgencyLevel)}`}>
                {getUrgencyLabel(problem.urgencyLevel)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
              <span>{problem.subfield.field.name}</span>
              <span className="text-zinc-600">→</span>
              <span>{problem.subfield.name}</span>
              {problem.country && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span>{problem.country}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {problem.title}
            </h1>

            <p className="mt-3 text-zinc-400 text-base leading-relaxed">
              {problem.description}
            </p>
          </div>

          {/* ── DETAILED CONTENT (Wikipedia-style) ─────────── */}
          {/* whitespace-pre-line preserves \n from DB as line breaks */}
          {/* Python equivalent: {{ problem.detailedContent|linebreaks }} */}
          {problem.detailedContent && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Overview</h2>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {problem.detailedContent}
              </p>
            </section>
          )}

          {/* ── IMPACT ─────────────────────────────────────── */}
          {problem.impact && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Impact</h2>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {problem.impact}
              </p>
            </section>
          )}

          {/* ── CURRENT PROGRESS ───────────────────────────── */}
          {problem.currentProgress && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Current Progress</h2>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {problem.currentProgress}
              </p>
            </section>
          )}

          {/* ── WHAT HAS BEEN TRIED ────────────────────────── */}
          {problem.whatHasBeenTried && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">What Has Been Tried</h2>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {problem.whatHasBeenTried}
              </p>
            </section>
          )}

          {/* ── APPLICABLE FIELDS ──────────────────────────── */}
          {/* From junction table problem_applicable_fields. */}
          {/* Will be empty until you run the seed update. */}
          {problem.applicableFields.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Fields That Can Help</h2>
              <div className="space-y-4">
                {problem.applicableFields.map(function(af) {
                  return (
                    <div key={af.fieldId} className="border border-zinc-800 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-2">{af.field.name}</h3>
                      {af.howThisFieldHelps && (
                        <p className="text-zinc-400 text-sm mb-2">{af.howThisFieldHelps}</p>
                      )}
                      {af.relevantTechniques && (
                        <p className="text-zinc-500 text-xs">
                          <span className="text-zinc-400 font-medium">Techniques: </span>
                          {af.relevantTechniques}
                        </p>
                      )}
                      {af.openResearchQuestions && (
                        <p className="text-zinc-500 text-xs mt-1">
                          <span className="text-zinc-400 font-medium">Open Questions: </span>
                          {af.openResearchQuestions}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── RELATED CONTENT SIDEBAR ───────────────────────── */}
          <div className="pt-8 mb-8 border-t border-zinc-800">
            <RelatedContentSidebar 
              relevantPosts={relevantPosts}
              researchers={researchers}
              fundingOpportunities={fundingOpportunities}
            />
          </div>

        </div>

        {/* ── AI CHAT BUTTON (placeholder) ─────────────────── */}
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6">
          <button className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}