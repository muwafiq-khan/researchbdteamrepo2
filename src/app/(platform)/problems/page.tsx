import { prisma } from '../../../lib/prisma'
import ProblemFeed from '../../../modules/problems/components/ProblemFeed'
import FilterIconButton from '../../../shared/components/FilterIconButton'
import GlobalFilterOverlay from '../../../shared/components/GlobalFilterOverlay'

const PAGE_SIZE = 10

export default async function ProblemsPage() {

  const problems = await prisma.problems.findMany({
    where: { isActive: true },
    include: {
      subfield: {
        include: {
          field: true
        }
      }
    },
    orderBy: { urgencyLevel: 'asc' },
    take: PAGE_SIZE,
  })

  const plainProblems = JSON.parse(JSON.stringify(problems))

  return (
    <div>
      <div className="flex justify-end px-4 pt-3 pb-1">
        <FilterIconButton />
      </div>
      <ProblemFeed initialProblems={plainProblems} />
      <GlobalFilterOverlay />
    </div>
  )
}
