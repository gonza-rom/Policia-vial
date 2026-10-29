-- AlterTable
ALTER TABLE "ConflictoSincronizacion" ADD COLUMN     "procedimientoId" TEXT,
ADD COLUMN     "relevamientoId" TEXT,
ALTER COLUMN "actaId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ConflictoSincronizacion_procedimientoId_idx" ON "ConflictoSincronizacion"("procedimientoId");

-- CreateIndex
CREATE INDEX "ConflictoSincronizacion_relevamientoId_idx" ON "ConflictoSincronizacion"("relevamientoId");
