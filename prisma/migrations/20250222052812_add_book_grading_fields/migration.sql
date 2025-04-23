/*
  Warnings:

  - Added the required column `analysis` to the `book_grading_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "book_grading_history" ADD COLUMN "analysis" TEXT;

-- Add other columns
ALTER TABLE "book_grading_history" 
ADD COLUMN "author_name" TEXT,
ADD COLUMN "book_grade" TEXT;

-- Update existing rows with a default value
UPDATE "book_grading_history" SET "analysis" = 'No analysis available' WHERE "analysis" IS NULL;

-- Make analysis required
ALTER TABLE "book_grading_history" ALTER COLUMN "analysis" SET NOT NULL;
