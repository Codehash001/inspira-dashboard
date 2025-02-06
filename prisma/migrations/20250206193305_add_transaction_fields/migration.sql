-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "token_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "token_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "transaction_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "transaction_note" TEXT;
