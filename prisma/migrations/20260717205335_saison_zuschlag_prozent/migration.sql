-- AlterTable
ALTER TABLE "SeasonRate" ADD COLUMN     "zuschlagProzent" INTEGER,
ALTER COLUMN "preisProTagCent" DROP NOT NULL,
ALTER COLUMN "vehicleClassId" DROP NOT NULL;
