/*
  Warnings:

  - You are about to drop the column `preisCent` on the `ServiceAddon` table. All the data in the column will be lost.
  - Added the required column `vehicleClassId` to the `SeasonRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleClassId` to the `TariffRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleClassId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleClassNameSnapshot` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SeasonRate_productId_startDate_endDate_idx";

-- DropIndex
DROP INDEX "TariffRule_productId_idx";

-- AlterTable
ALTER TABLE "SeasonRate" ADD COLUMN     "vehicleClassId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceAddon" DROP COLUMN "preisCent";

-- AlterTable
ALTER TABLE "TariffRule" ADD COLUMN     "vehicleClassId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "vehicleClassId" TEXT NOT NULL,
ADD COLUMN     "vehicleClassNameSnapshot" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "VehicleClass" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VehicleClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddonPrice" (
    "id" TEXT NOT NULL,
    "serviceAddonId" TEXT NOT NULL,
    "vehicleClassId" TEXT NOT NULL,
    "preisCent" INTEGER NOT NULL,

    CONSTRAINT "ServiceAddonPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleClass_code_key" ON "VehicleClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAddonPrice_serviceAddonId_vehicleClassId_key" ON "ServiceAddonPrice"("serviceAddonId", "vehicleClassId");

-- CreateIndex
CREATE INDEX "SeasonRate_productId_vehicleClassId_startDate_endDate_idx" ON "SeasonRate"("productId", "vehicleClassId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "TariffRule_productId_vehicleClassId_idx" ON "TariffRule"("productId", "vehicleClassId");

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonRate" ADD CONSTRAINT "SeasonRate_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddonPrice" ADD CONSTRAINT "ServiceAddonPrice_serviceAddonId_fkey" FOREIGN KEY ("serviceAddonId") REFERENCES "ServiceAddon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddonPrice" ADD CONSTRAINT "ServiceAddonPrice_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
