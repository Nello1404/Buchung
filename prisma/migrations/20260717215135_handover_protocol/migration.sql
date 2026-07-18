-- CreateEnum
CREATE TYPE "HandoverPhase" AS ENUM ('EINFAHRT', 'AUSFAHRT');

-- CreateTable
CREATE TABLE "HandoverProtocol" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "phase" "HandoverPhase" NOT NULL,
    "fahrer" TEXT NOT NULL,
    "kmStand" INTEGER,
    "tankstand" TEXT,
    "bemerkung" TEXT,
    "unterschriftUrl" TEXT,
    "unterschriftPfad" TEXT,
    "erstelltVon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverPhoto" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HandoverProtocol_bookingId_idx" ON "HandoverProtocol"("bookingId");

-- CreateIndex
CREATE INDEX "HandoverPhoto_protocolId_idx" ON "HandoverPhoto"("protocolId");

-- AddForeignKey
ALTER TABLE "HandoverProtocol" ADD CONSTRAINT "HandoverProtocol_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverPhoto" ADD CONSTRAINT "HandoverPhoto_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "HandoverProtocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
