/*
  Warnings:

  - Added the required column `analysis` to the `smart_contract_audit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contract_code` to the `smart_contract_audit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "smart_contract_audit" 
ADD COLUMN "analysis" TEXT,
ADD COLUMN "contract_code" TEXT,
ADD COLUMN "severity" TEXT,
ADD COLUMN "vulnerabilities" JSONB;

-- Update existing rows with default values
UPDATE "smart_contract_audit"
SET "analysis" = 'Legacy audit - no analysis available',
    "contract_code" = 'Legacy contract - code not available';

-- Now make the columns NOT NULL
ALTER TABLE "smart_contract_audit" 
ALTER COLUMN "analysis" SET NOT NULL,
ALTER COLUMN "contract_code" SET NOT NULL;
