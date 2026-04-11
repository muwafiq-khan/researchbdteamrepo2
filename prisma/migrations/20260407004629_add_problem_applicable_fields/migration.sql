-- CreateTable
CREATE TABLE "problem_applicable_fields" (
    "problemId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,

    CONSTRAINT "problem_applicable_fields_pkey" PRIMARY KEY ("problemId","fieldId")
);

-- AddForeignKey
ALTER TABLE "problem_applicable_fields" ADD CONSTRAINT "problem_applicable_fields_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_applicable_fields" ADD CONSTRAINT "problem_applicable_fields_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
