-- CreateTable
CREATE TABLE "users" (
    "wallet_id" TEXT NOT NULL,
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "credit_balances" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "allowed_credits" INTEGER NOT NULL,
    "purchased_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_date" TIMESTAMP(3) NOT NULL,
    "credit_used" INTEGER NOT NULL DEFAULT 0,
    "used_for" TEXT,
    "remaining_balance" INTEGER NOT NULL,

    CONSTRAINT "credit_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_history" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "session_name" TEXT NOT NULL,
    "user_message" TEXT NOT NULL,
    "bot_message" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "credit_used" INTEGER NOT NULL,
    "token_used" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_generation_history" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credit_used" INTEGER NOT NULL,
    "token_used" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,

    CONSTRAINT "image_generation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_generation_history" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credit_used" INTEGER NOT NULL,
    "token_used" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,

    CONSTRAINT "video_generation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_grading_history" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "book_cover_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credit_used" INTEGER NOT NULL,
    "token_used" INTEGER NOT NULL,
    "book_grade" TEXT NOT NULL,

    CONSTRAINT "book_grading_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_hash" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "payment_method" TEXT NOT NULL DEFAULT 'INSPI',

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "image_generation_history_image_id_key" ON "image_generation_history"("image_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_generation_history_video_id_key" ON "video_generation_history"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_grading_history_book_id_key" ON "book_grading_history"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_hash_key" ON "transactions"("transaction_hash");

-- AddForeignKey
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_generation_history" ADD CONSTRAINT "image_generation_history_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_generation_history" ADD CONSTRAINT "video_generation_history_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_grading_history" ADD CONSTRAINT "book_grading_history_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;
