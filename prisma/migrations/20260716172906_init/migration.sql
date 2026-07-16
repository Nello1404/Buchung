-- CreateEnum
CREATE TYPE "ProductCode" AS ENUM ('VALET', 'SHUTTLE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ANGEFRAGT', 'BEZAHLT', 'UEBERGEBEN', 'GEPARKT', 'BEREITGESTELLT', 'ABGESCHLOSSEN', 'STORNIERT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('OFFEN', 'BEZAHLT', 'TEILERSTATTET', 'ERSTATTET', 'FEHLGESCHLAGEN');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" "ProductCode" NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffRule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minTage" INTEGER NOT NULL,
    "maxTage" INTEGER,
    "preisProTagCent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonRate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "preisProTagCent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDay" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacityDay" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kontingent" INTEGER NOT NULL,
    "belegt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CapacityDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "preisCent" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceAddonId" TEXT NOT NULL,
    "preisCentSnapshot" INTEGER NOT NULL,
    "nameSnapshot" TEXT NOT NULL,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBookingId" TEXT,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kennzeichen" TEXT NOT NULL,
    "marke" TEXT,
    "farbe" TEXT,
    "auffaelligkeiten" TEXT,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "betragCent" INTEGER NOT NULL,
    "erstattetCent" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'OFFEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'ANGEFRAGT',
    "anreise" TIMESTAMP(3) NOT NULL,
    "abreise" TIMESTAMP(3) NOT NULL,
    "flugnummer" TEXT,
    "preisTageCent" INTEGER NOT NULL,
    "preisAddonsCent" INTEGER NOT NULL DEFAULT 0,
    "gutscheinRabattCent" INTEGER NOT NULL DEFAULT 0,
    "preisGesamtCent" INTEGER NOT NULL,
    "preisBreakdown" JSONB NOT NULL,
    "stornierbarBisFrueherProzent" INTEGER NOT NULL DEFAULT 100,
    "stornoFristStunden" INTEGER NOT NULL DEFAULT 48,
    "storniertAm" TIMESTAMP(3),
    "erstattungProzent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "stornoFristStunden" INTEGER NOT NULL DEFAULT 48,
    "stornoErstattungFrueh" INTEGER NOT NULL DEFAULT 100,
    "stornoErstattungSpaet" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "TariffRule_productId_idx" ON "TariffRule"("productId");

-- CreateIndex
CREATE INDEX "SeasonRate_productId_startDate_endDate_idx" ON "SeasonRate"("productId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDay_productId_date_key" ON "BlockedDay"("productId", "date");

-- CreateIndex
CREATE INDEX "CapacityDay_date_idx" ON "CapacityDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CapacityDay_productId_date_key" ON "CapacityDay"("productId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAddon_code_key" ON "ServiceAddon"("code");

-- CreateIndex
CREATE INDEX "BookingAddon_bookingId_idx" ON "BookingAddon"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_redeemedBookingId_key" ON "Voucher"("redeemedBookingId");

-- CreateIndex
CREATE INDEX "Voucher_customerId_idx" ON "Voucher"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_bookingId_key" ON "Vehicle"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_productId_anreise_abreise_idx" ON "Booking"("productId", "anreise", "abreise");

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonRate" ADD CONSTRAINT "SeasonRate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDay" ADD CONSTRAINT "BlockedDay_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityDay" ADD CONSTRAINT "CapacityDay_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_serviceAddonId_fkey" FOREIGN KEY ("serviceAddonId") REFERENCES "ServiceAddon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_redeemedBookingId_fkey" FOREIGN KEY ("redeemedBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
