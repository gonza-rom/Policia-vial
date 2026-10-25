-- CreateTable
CREATE TABLE "ConflictoSincronizacion" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "descartado" JSONB NOT NULL,
    "motivo" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConflictoSincronizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConflictoSincronizacion_actaId_idx" ON "ConflictoSincronizacion"("actaId");
