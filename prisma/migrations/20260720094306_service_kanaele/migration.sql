-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "aufServiceSeite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inBuchung" BOOLEAN NOT NULL DEFAULT false;
