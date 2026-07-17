-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "bezahltAm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Payment_bezahltAm_idx" ON "Payment"("bezahltAm");
