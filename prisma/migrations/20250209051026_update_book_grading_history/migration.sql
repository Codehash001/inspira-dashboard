/*
  Warnings:

  - You are about to drop the column `book_cover_url` on the `book_grading_history` table. All the data in the column will be lost.
  - Added the required column `analysis` to the `book_grading_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author_name` to the `book_grading_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `book_name` to the `book_grading_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "book_grading_history" DROP COLUMN "book_cover_url",
ADD COLUMN     "analysis" TEXT NOT NULL,
ADD COLUMN     "author_name" TEXT NOT NULL,
ADD COLUMN     "book_name" TEXT NOT NULL;
