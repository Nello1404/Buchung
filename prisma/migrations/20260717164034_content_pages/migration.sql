-- CreateTable
CREATE TABLE "ContentPage" (
    "slug" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPage_pkey" PRIMARY KEY ("slug")
);
