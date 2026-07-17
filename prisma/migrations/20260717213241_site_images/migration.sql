-- CreateEnum
CREATE TYPE "ImageCategory" AS ENUM ('STELLPLATZ', 'TEAM', 'FLOTTE', 'AUFBEREITUNG');

-- CreateTable
CREATE TABLE "SiteImage" (
    "id" TEXT NOT NULL,
    "kategorie" "ImageCategory" NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteImage_kategorie_active_sortOrder_idx" ON "SiteImage"("kategorie", "active", "sortOrder");
