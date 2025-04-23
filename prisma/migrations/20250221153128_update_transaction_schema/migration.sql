/*
  Warnings:

  - You are about to drop the column `amount` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `token_amount` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `token_price` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "amount",
DROP COLUMN "token_amount",
DROP COLUMN "token_price",
ADD COLUMN     "credits_added" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payment_amount" INTEGER NOT NULL DEFAULT 0;
