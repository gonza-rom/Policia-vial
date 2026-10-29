-- AlterTable
ALTER TABLE "ConflictoSincronizacion" ADD COLUMN     "requerimientoId" TEXT;

-- CreateIndex
CREATE INDEX "ConflictoSincronizacion_requerimientoId_idx" ON "ConflictoSincronizacion"("requerimientoId");
