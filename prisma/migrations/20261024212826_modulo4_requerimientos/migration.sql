-- CreateEnum
CREATE TYPE "TipoRequerimiento" AS ENUM ('PERSONA', 'VEHICULO');

-- CreateTable
CREATE TABLE "Requerimiento" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "tipo" "TipoRequerimiento" NOT NULL,
    "puestoId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "datosOrden" TEXT,
    "motivo" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requerimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Requerimiento_numero_key" ON "Requerimiento"("numero");

-- CreateIndex
CREATE INDEX "Requerimiento_tipo_idx" ON "Requerimiento"("tipo");

-- CreateIndex
CREATE INDEX "Requerimiento_fecha_idx" ON "Requerimiento"("fecha");

-- CreateIndex
CREATE INDEX "Requerimiento_puestoId_idx" ON "Requerimiento"("puestoId");

-- AddForeignKey
ALTER TABLE "Requerimiento" ADD CONSTRAINT "Requerimiento_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requerimiento" ADD CONSTRAINT "Requerimiento_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
