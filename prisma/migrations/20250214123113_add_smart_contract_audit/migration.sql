-- CreateTable
CREATE TABLE "smart_contract_audits" (
    "id" SERIAL NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "contract_name" TEXT NOT NULL,
    "contract_code" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "overall_severity" TEXT NOT NULL,
    "credit_used" DOUBLE PRECISION NOT NULL,
    "token_used" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smart_contract_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "smart_contract_audits_contract_id_key" ON "smart_contract_audits"("contract_id");

-- AddForeignKey
ALTER TABLE "smart_contract_audits" ADD CONSTRAINT "smart_contract_audits_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "users"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;
