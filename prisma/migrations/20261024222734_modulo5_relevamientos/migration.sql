-- CreateEnum
CREATE TYPE "ModalidadRelevamiento" AS ENUM ('FINES_LARGOS', 'DIA_VIRGEN');

-- CreateEnum
CREATE TYPE "MedioTransporte" AS ENUM ('VEHICULO', 'CAMINATA', 'BICICLETA', 'CABALLO', 'COLECTIVO', 'CAMION');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('FEMENINO', 'MASCULINO', 'NO_BINARIO');

-- CreateTable
CREATE TABLE "Relevamiento" (
    "id" TEXT NOT NULL,
    "modalidad" "ModalidadRelevamiento" NOT NULL,
    "cantidadPersonas" INTEGER NOT NULL DEFAULT 1,
    "procedencia" TEXT,
    "medioTransporte" "MedioTransporte",
    "sexo" "Sexo",
    "puestoId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relevamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relevamiento_modalidad_idx" ON "Relevamiento"("modalidad");

-- CreateIndex
CREATE INDEX "Relevamiento_fecha_idx" ON "Relevamiento"("fecha");

-- CreateIndex
CREATE INDEX "Relevamiento_puestoId_idx" ON "Relevamiento"("puestoId");

-- AddForeignKey
ALTER TABLE "Relevamiento" ADD CONSTRAINT "Relevamiento_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relevamiento" ADD CONSTRAINT "Relevamiento_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
