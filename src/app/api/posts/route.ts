import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {

  // ── 1. Authentication check ─────────────────────────────────
  // getServerSession reads the JWT cookie and returns the user.
  // If no valid session, the user isn't logged in.
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be logged in to create a post' },
      { status: 401 }
    )
  }

  const userId = session.user.id
  const accountType = session.user.accountType

  // ── 2. Parse the request body ───────────────────────────────
  const body = await request.json()

  // ── 3. Extract base post fields (shared by all types) ───────
  const {
    postType,
    title,
    visibility,
    problemId,
    ...extensionFields    // everything else is type-specific
  } = body
  // The spread operator `...extensionFields` collects ALL remaining
  // fields from body into one object. So if body has { postType, title,
  // visibility, problemId, problemStatement, domainDescription },
  // extensionFields becomes { problemStatement, domainDescription }.
  // This cleanly separates base fields from extension fields.

  // ── 4. Validate required base fields ────────────────────────
  if (!postType || !title) {
    return NextResponse.json(
      { error: 'Post type and title are required' },
      { status: 400 }
    )
  }

  // ── 5. Authorization: enforce account type / post type rules ─
  // Funding agencies can ONLY post funding_opportunity.
  // Researchers can post anything EXCEPT funding_opportunity.
  if (accountType === 'funding_agency' && postType !== 'funding_opportunity') {
    return NextResponse.json(
      { error: 'Funding agencies can only create funding opportunity posts' },
      { status: 403 }
    )
  }

  if (accountType === 'researcher' && postType === 'funding_opportunity') {
    return NextResponse.json(
      { error: 'Only funding agencies can create funding opportunity posts' },
      { status: 403 }
    )
  }

  // ── 6. Create post + extension in a transaction ─────────────
  try {
    const post = await prisma.$transaction(async function(tx) {

      // 6a. Create the base post row
      const newPost = await tx.posts.create({
        data: {
          authorId: userId,
          postType: postType,
          title: title,
          visibility: visibility || 'public',
          problemId: problemId || null,
        },
      })

      // 6b. Create the extension row based on post type.
      // Each extension table has postId as its primary key,
      // linking it 1:1 with the base post.
      if (postType === 'collaboration') {
        await tx.collaboration_posts.create({
          data: {
            postId: newPost.id,
            problemStatement: extensionFields.problemStatement,
            domainDescription: extensionFields.domainDescription,
            proposedApproach: extensionFields.proposedApproach,
            expectedOutcome: extensionFields.expectedOutcome,
            researchLevel: extensionFields.researchLevel,
            requiredExpertise: extensionFields.requiredExpertise,
            timeline: extensionFields.timeline || null,
            maxCollaborators: extensionFields.maxCollaborators || null,
            freeExpression: extensionFields.freeExpression || null,
          },
        })
      }

      if (postType === 'help') {
        await tx.help_posts.create({
          data: {
            postId: newPost.id,
            problemSpecification: extensionFields.problemSpecification,
            whereStuck: extensionFields.whereStuck,
            whatTried: extensionFields.whatTried,
            minQualificationScore: extensionFields.minQualificationScore || 0,
            freeExpression: extensionFields.freeExpression || null,
          },
        })
      }

      if (postType === 'finished_work') {
        await tx.finished_work_posts.create({
          data: {
            postId: newPost.id,
            methodology: extensionFields.methodology,
            keyFindings: extensionFields.keyFindings,
            futureScope: extensionFields.futureScope || null,
            paperUrl: extensionFields.paperUrl || null,
            githubUrl: extensionFields.githubUrl || null,
            journalName: extensionFields.journalName || null,
            publicationDate: extensionFields.publicationDate
              ? new Date(extensionFields.publicationDate)
              : null,
            freeExpression: extensionFields.freeExpression || null,
          },
        })
      }

      if (postType === 'funding_opportunity') {
        await tx.funding_opportunity_posts.create({
          data: {
            postId: newPost.id,
            fundingAmountMin: extensionFields.fundingAmountMin || null,
            fundingAmountMax: extensionFields.fundingAmountMax || null,
            deliverables: extensionFields.deliverables || null,
            contactInfo: extensionFields.contactInfo,
          },
        })
      }

      // Return the created post — this becomes the value of `post`
      // outside the transaction
      return newPost
    })

    // ── 7. Success response ─────────────────────────────────────
    return NextResponse.json({ post: post }, { status: 201 })

  } catch (err: any) {
    console.error('Post creation failed:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create post' },
      { status: 500 }
    )
  }
}
