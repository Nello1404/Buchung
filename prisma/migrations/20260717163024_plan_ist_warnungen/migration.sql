-- AlterTable
ALTER TABLE "ExpenseCategory" ADD COLUMN     "monatsBudgetCent" INTEGER;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "warnAuslastungProzent" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "warnStornoquoteProzent" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "warnTagVollProzent" INTEGER NOT NULL DEFAULT 90;

-- CreateTable
CREATE TABLE "PlanMonth" (
    "id" TEXT NOT NULL,
    "jahr" INTEGER NOT NULL,
    "monat" INTEGER NOT NULL,
    "auslastungValetProzent" INTEGER NOT NULL DEFAULT 0,
    "auslastungShuttleProzent" INTEGER NOT NULL DEFAULT 0,
    "umsatzCent" INTEGER NOT NULL DEFAULT 0,
    "kostenCent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanMonth_jahr_monat_key" ON "PlanMonth"("jahr", "monat");
