-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "resource_type" TEXT DEFAULT 'raw',
ADD COLUMN     "thumbnail_url" TEXT;
