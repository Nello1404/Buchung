/*
  Warnings:

  - You are about to drop the column `stornierbarBisFrueherProzent` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "stornierbarBisFrueherProzent",
ADD COLUMN     "stornoErstattungFruehProzent" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "stornoErstattungSpaetProzent" INTEGER NOT NULL DEFAULT 50;
