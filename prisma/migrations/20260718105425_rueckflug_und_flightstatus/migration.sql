-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "rueckflugnummer" TEXT;

-- CreateTable
CREATE TABLE "FlightStatus" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "datum" TEXT NOT NULL,
    "status" TEXT,
    "scheduledArrival" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "arrivalAirport" TEXT,
    "nichtGefunden" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightStatus_flightNumber_datum_key" ON "FlightStatus"("flightNumber", "datum");
