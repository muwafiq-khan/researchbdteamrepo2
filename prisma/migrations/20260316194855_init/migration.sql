-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('researcher', 'funding_agency');

-- CreateEnum
CREATE TYPE "AcademicLevel" AS ENUM ('undergraduate', 'postgraduate', 'phd', 'professor', 'researcher', 'industry');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('email_verification', 'password_reset');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('critical', 'moderate', 'exploratory');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('collaboration', 'help', 'finished_work', 'funding_opportunity');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'friends_only', 'university_only');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('friend', 'follow');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('pending', 'accepted', 'rejected', 'removed');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "CollabRequestStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notificationPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "researchers" (
    "userId" TEXT NOT NULL,
    "institution" TEXT,
    "academicLevel" "AcademicLevel",
    "bio" TEXT,
    "orcidId" TEXT,
    "googleScholarId" TEXT,

    CONSTRAINT "researchers_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "researcher_qualifications" (
    "researcherId" TEXT NOT NULL,
    "hIndex" INTEGER NOT NULL DEFAULT 0,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "publicationCount" INTEGER NOT NULL DEFAULT 0,
    "starScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedbackQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionPoints" INTEGER NOT NULL DEFAULT 0,
    "qualificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "researcher_qualifications_pkey" PRIMARY KEY ("researcherId")
);

-- CreateTable
CREATE TABLE "funding_agencies" (
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT,
    "description" TEXT,

    CONSTRAINT "funding_agencies_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenType" "AuthTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subfields" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "subfields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "researcher_fields" (
    "researcherId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,

    CONSTRAINT "researcher_fields_pkey" PRIMARY KEY ("researcherId","fieldId")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "subfieldId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgencyLevel" "UrgencyLevel" NOT NULL,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "searchVector" TEXT,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "groupId" TEXT,
    "postType" "PostType" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "title" TEXT NOT NULL,
    "problemId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "searchVector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_posts" (
    "postId" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "domainDescription" TEXT NOT NULL,
    "proposedApproach" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "researchLevel" "AcademicLevel" NOT NULL,
    "requiredExpertise" TEXT NOT NULL,
    "timeline" TEXT,
    "maxCollaborators" INTEGER,
    "freeExpression" TEXT,
    "weightedUpvoteScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "collaboration_posts_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "help_posts" (
    "postId" TEXT NOT NULL,
    "problemSpecification" TEXT NOT NULL,
    "whereStuck" TEXT NOT NULL,
    "whatTried" TEXT NOT NULL,
    "minQualificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeExpression" TEXT,

    CONSTRAINT "help_posts_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "finished_work_posts" (
    "postId" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "keyFindings" TEXT NOT NULL,
    "futureScope" TEXT,
    "paperUrl" TEXT,
    "githubUrl" TEXT,
    "journalName" TEXT,
    "publicationDate" TIMESTAMP(3),
    "freeExpression" TEXT,
    "weightedUpvoteScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "finished_work_posts_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "funding_opportunity_posts" (
    "postId" TEXT NOT NULL,
    "fundingAmountMin" DOUBLE PRECISION,
    "fundingAmountMax" DOUBLE PRECISION,
    "deliverables" TEXT,
    "contactInfo" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "funding_opportunity_posts_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "connectionType" "ConnectionType" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_requests" (
    "id" TEXT NOT NULL,
    "researcherId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "status" "CollabRequestStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdFromPostId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "post_attachments" (
    "id" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,

    CONSTRAINT "post_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_reactions" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("userId","postId")
);

-- CreateTable
CREATE TABLE "post_saves" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_saves_pkey" PRIMARY KEY ("userId","postId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "fields_name_key" ON "fields"("name");

-- AddForeignKey
ALTER TABLE "researchers" ADD CONSTRAINT "researchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "researcher_qualifications" ADD CONSTRAINT "researcher_qualifications_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "researchers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_agencies" ADD CONSTRAINT "funding_agencies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subfields" ADD CONSTRAINT "subfields_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "researcher_fields" ADD CONSTRAINT "researcher_fields_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "researchers"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "researcher_fields" ADD CONSTRAINT "researcher_fields_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_subfieldId_fkey" FOREIGN KEY ("subfieldId") REFERENCES "subfields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_posts" ADD CONSTRAINT "collaboration_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_posts" ADD CONSTRAINT "help_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_work_posts" ADD CONSTRAINT "finished_work_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_opportunity_posts" ADD CONSTRAINT "funding_opportunity_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_saves" ADD CONSTRAINT "post_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_saves" ADD CONSTRAINT "post_saves_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
