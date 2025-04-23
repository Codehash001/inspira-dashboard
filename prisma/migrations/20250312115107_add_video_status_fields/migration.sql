-- AlterTable
ALTER TABLE "video_generation_history" ADD COLUMN     "error" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "video_url" DROP NOT NULL,
ALTER COLUMN "resolution" DROP NOT NULL;
