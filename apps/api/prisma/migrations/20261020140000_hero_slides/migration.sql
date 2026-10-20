-- CreateEnum
CREATE TYPE "HeroSlideKind" AS ENUM ('PRODUCTS', 'IMAGE');

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "kind" "HeroSlideKind" NOT NULL,
    "headline" TEXT NOT NULL,
    "subtext" TEXT NOT NULL DEFAULT '',
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "image" TEXT,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tone" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeroSlide_active_sortOrder_idx" ON "HeroSlide"("active", "sortOrder");

