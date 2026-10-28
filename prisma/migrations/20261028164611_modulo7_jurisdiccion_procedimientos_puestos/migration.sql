-- CreateEnum
CREATE TYPE "Jurisdiccion" AS ENUM ('CAPITAL', 'HUILLAPIMA', 'LA_PUERTA');

-- CreateEnum
CREATE TYPE "ModalidadTrabajo" AS ENUM ('HABITUAL', 'OTRA_JURISDICCION');

-- CreateEnum
CREATE TYPE "TipoProcedimiento" AS ENUM ('ORDEN_JUDICIAL', 'SECUESTRO', 'DEMORA', 'ARRESTO', 'DETENCION', 'UBICACION_PARADERO', 'ESTUPEFACIENTES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModalidadRelevamiento" ADD VALUE 'SEMANA_ESTUDIANTIL';
ALTER TYPE "ModalidadRelevamiento" ADD VALUE 'FESTIVALES';
ALTER TYPE "ModalidadRelevamiento" ADD VALUE 'PONCHO';

-- AlterTable
ALTER TABLE "Acta" ADD COLUMN     "jurisdiccion" "Jurisdiccion",
ADD COLUMN     "modalidadTrabajo" "ModalidadTrabajo" NOT NULL DEFAULT 'HABITUAL',
ADD COLUMN     "motivoOtraJurisdiccion" TEXT,
ADD COLUMN     "puestoTrabajoId" TEXT;

-- AlterTable
ALTER TABLE "Puesto" ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "jurisdiccionesMunicipales" "Jurisdiccion"[] DEFAULT ARRAY[]::"Jurisdiccion"[],
ADD COLUMN     "latitud" DECIMAL(9,6),
ADD COLUMN     "longitud" DECIMAL(9,6);

-- CreateTable
CREATE TABLE "Procedimiento" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "tipo" "TipoProcedimiento" NOT NULL,
    "puestoId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modalidadTrabajo" "ModalidadTrabajo" NOT NULL DEFAULT 'HABITUAL',
    "puestoTrabajoId" TEXT,
    "jurisdiccion" "Jurisdiccion",
    "motivoOtraJurisdiccion" TEXT,
    "personaNombre" TEXT,
    "personaDni" TEXT,
    "vehiculoDominio" TEXT,
    "descripcion" TEXT NOT NULL,
    "datosOrden" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Procedimiento_numero_key" ON "Procedimiento"("numero");

-- CreateIndex
CREATE INDEX "Procedimiento_tipo_idx" ON "Procedimiento"("tipo");

-- CreateIndex
CREATE INDEX "Procedimiento_fecha_idx" ON "Procedimiento"("fecha");

-- CreateIndex
CREATE INDEX "Procedimiento_puestoId_idx" ON "Procedimiento"("puestoId");

-- CreateIndex
CREATE UNIQUE INDEX "Puesto_codigo_key" ON "Puesto"("codigo");

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_puestoTrabajoId_fkey" FOREIGN KEY ("puestoTrabajoId") REFERENCES "Puesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_puestoTrabajoId_fkey" FOREIGN KEY ("puestoTrabajoId") REFERENCES "Puesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

