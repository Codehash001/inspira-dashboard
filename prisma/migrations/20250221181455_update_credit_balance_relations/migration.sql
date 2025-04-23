/*
  Warnings:

  - You are about to drop the column `analysis` on the `book_grading_history` table. All the data in the column will be lost.
  - You are about to drop the column `author_name` on the `book_grading_history` table. All the data in the column will be lost.
  - You are about to drop the column `book_grade` on the `book_grading_history` table. All the data in the column will be lost.
  - You are about to drop the `smart_contract_audits` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `transaction_id` on table `credit_balances` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "credit_balances" DROP CONSTRAINT "credit_balances_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "smart_contract_audits" DROP CONSTRAINT "smart_contract_audits_wallet_id_fkey";

-- DropIndex
DROP INDEX "transactions_transaction_hash_key";

-- AlterTable
ALTER TABLE "book_grading_history" DROP COLUMN "analysis",
DROP COLUMN "author_name",
DROP COLUMN "book_grade";

-- AlterTable
ALTER TABLE "credit_balances" ALTER COLUMN "transaction_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "transaction_hash" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "payment_method" DROP DEFAULT,
ALTER COLUMN "transaction_fee" DROP DEFAULT,
ALTER COLUMN "credits_added" DROP DEFAULT,
ALTER COLUMN "credits_added" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "payment_amount" DROP DEFAULT,
ALTER COLUMN "payment_amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_free_claim" TIMESTAMP(3);

-- DropTable
DROP TABLE "smart_contract_audits";

-- CreateTable
CREATE TABLE "smart_contract_audit" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "contract_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credit_used" DOUBLE PRECISION NOT NULL,
    "token_used" INTEGER NOT NULL,

    CONSTRAINT "smart_contract_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "smart_contract_audit_contract_id_key" ON "smart_contract_audit"("contract_id");

-- AddForeignKey
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_contract_audit" ADD CONSTRAINT "smart_contract_audit_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;
