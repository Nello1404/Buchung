-- DropForeignKey
ALTER TABLE "BookingAddon" DROP CONSTRAINT "BookingAddon_serviceAddonId_fkey";

-- AlterTable
ALTER TABLE "BookingAddon" ADD COLUMN     "serviceId" TEXT,
ALTER COLUMN "serviceAddonId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_serviceAddonId_fkey" FOREIGN KEY ("serviceAddonId") REFERENCES "ServiceAddon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
