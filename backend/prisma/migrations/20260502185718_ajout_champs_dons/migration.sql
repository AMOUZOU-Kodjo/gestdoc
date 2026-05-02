-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "don_actif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "don_message" TEXT NOT NULL DEFAULT 'Votre don nous aide à maintenir la plateforme.',
ADD COLUMN     "don_montants" TEXT NOT NULL DEFAULT '500,1000,2000,5000',
ADD COLUMN     "don_nom" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "don_numero" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "don_titre" TEXT NOT NULL DEFAULT 'Soutenez GestDoc 💙';
