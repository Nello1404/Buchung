-- CreateEnum
CREATE TYPE "ServiceTyp" AS ENUM ('FESTPREIS', 'ANFRAGE');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL,
    "beschreibung" TEXT,
    "typ" "ServiceTyp" NOT NULL DEFAULT 'ANFRAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePreis" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "vehicleClassId" TEXT NOT NULL,
    "preisCent" INTEGER NOT NULL,

    CONSTRAINT "ServicePreis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAnfrage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT,
    "kennzeichen" TEXT,
    "fahrzeug" TEXT,
    "wunschtermin" TEXT,
    "leistungen" TEXT NOT NULL,
    "nachricht" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAnfrage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePreis_serviceId_vehicleClassId_key" ON "ServicePreis"("serviceId", "vehicleClassId");

-- CreateIndex
CREATE INDEX "ServiceAnfrage_status_createdAt_idx" ON "ServiceAnfrage"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ServicePreis" ADD CONSTRAINT "ServicePreis_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePreis" ADD CONSTRAINT "ServicePreis_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
