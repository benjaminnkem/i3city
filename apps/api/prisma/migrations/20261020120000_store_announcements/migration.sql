-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "announcements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "announcementsEnabled" BOOLEAN NOT NULL DEFAULT false;
