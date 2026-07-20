-- Fahrer -> Mitarbeiter: Tabelle umbenennen (bestehende Fahrer bleiben erhalten).
ALTER TABLE "Fahrer" RENAME TO "Mitarbeiter";
ALTER TABLE "Mitarbeiter" RENAME CONSTRAINT "Fahrer_pkey" TO "Mitarbeiter_pkey";

-- Neue Spalten.
ALTER TABLE "Mitarbeiter" ADD COLUMN "email" TEXT;
ALTER TABLE "Mitarbeiter" ADD COLUMN "istFahrer" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Mitarbeiter" ADD COLUMN "rolle" TEXT;
-- feedToken zunächst nullable, dann für bestehende Zeilen befüllen, dann NOT NULL.
ALTER TABLE "Mitarbeiter" ADD COLUMN "feedToken" TEXT;
UPDATE "Mitarbeiter" SET "feedToken" = replace(gen_random_uuid()::text, '-', '') WHERE "feedToken" IS NULL;
ALTER TABLE "Mitarbeiter" ALTER COLUMN "feedToken" SET NOT NULL;

-- CreateTable
CREATE TABLE "Schicht" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "vonZeit" TEXT NOT NULL,
    "bisZeit" TEXT NOT NULL,
    "notiz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schicht_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mitarbeiter_feedToken_key" ON "Mitarbeiter"("feedToken");

-- CreateIndex
CREATE INDEX "Schicht_datum_idx" ON "Schicht"("datum");

-- CreateIndex
CREATE INDEX "Schicht_mitarbeiterId_datum_idx" ON "Schicht"("mitarbeiterId", "datum");

-- AddForeignKey
ALTER TABLE "Schicht" ADD CONSTRAINT "Schicht_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
