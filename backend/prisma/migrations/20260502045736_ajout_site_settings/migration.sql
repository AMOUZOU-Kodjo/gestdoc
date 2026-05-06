/*
  Warnings:

  - You are about to drop the column `email` on the `login_attempts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "login_attempts" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "site_name" TEXT NOT NULL DEFAULT 'GestDoc',
    "site_description" TEXT NOT NULL DEFAULT 'Plateforme de partage de documents scolaires',
    "contact_email" TEXT NOT NULL DEFAULT 'phipsipy@gmail.com',
    "contact_phone" TEXT NOT NULL DEFAULT '+228 91 03 87 27',
    "contact_address" TEXT NOT NULL DEFAULT 'Lomé, Togo',
    "facebook_url" TEXT NOT NULL DEFAULT '',
    "twitter_url" TEXT NOT NULL DEFAULT '',
    "instagram_url" TEXT NOT NULL DEFAULT '',
    "youtube_url" TEXT NOT NULL DEFAULT '',
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "allow_uploads" BOOLEAN NOT NULL DEFAULT true,
    "max_file_size_mb" INTEGER NOT NULL DEFAULT 20,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
