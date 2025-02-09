-- AlterTable
ALTER TABLE "book_grading_history" ALTER COLUMN "credit_used" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "chat_history" ALTER COLUMN "credit_used" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "credit_balances" ALTER COLUMN "allowed_credits" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "credit_used" SET DEFAULT 0,
ALTER COLUMN "credit_used" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "remaining_balance" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "image_generation_history" ALTER COLUMN "credit_used" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "video_generation_history" ALTER COLUMN "credit_used" SET DATA TYPE DOUBLE PRECISION;
