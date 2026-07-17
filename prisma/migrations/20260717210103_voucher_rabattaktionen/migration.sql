-- CreateEnum
CREATE TYPE "VoucherTyp" AS ENUM ('TAG_GRATIS', 'PROZENT', 'BETRAG');

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "bezeichnung" TEXT,
ADD COLUMN     "typ" "VoucherTyp" NOT NULL DEFAULT 'TAG_GRATIS',
ADD COLUMN     "wert" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "customerId" DROP NOT NULL;
